import type { AssessmentExtractor, ExtractedResult } from "./base";
import { getSchemaFor } from "../schemas";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

// no-op

export const googleExtractor: AssessmentExtractor = {
  async extract({ bytes, mimeType, typeSlug }): Promise<ExtractedResult> {
    const schema = getSchemaFor(typeSlug);
    const debugRaw = (process.env.AI_LOG_RAW || "").toLowerCase();
    const shouldLogRaw = debugRaw === "1" || debugRaw === "true";
    
    // For PDFs, skip direct extraction and go straight to text extraction
    const isPdf = mimeType === "application/pdf";
    
    if (!isPdf) {
      // Try direct extraction for images
      try {
        const res = await generateObject({
          model: google("gemini-2.5-flash"),
          schema,
          temperature: 0,
          messages: [
            { role: "system", content: "Extract structured data for this assessment. Respond ONLY with valid JSON matching the schema. If you can't find all fields, extract what you can see." },
            {
              role: "user",
              content: [
                { type: "text", text: `Type slug: ${typeSlug}. Extract all visible data from this assessment.` },
                { type: "file", data: bytes, mediaType: mimeType },
              ],
            },
          ],
          maxOutputTokens: 1000,
        });

        const parsed = (res as any).object ?? {};
        if (shouldLogRaw) {
          console.info("[ai][google] direct extraction", { typeSlug, parsed });
        }

        const hasStructured = parsed && Object.keys(parsed).length > 0;
        if (hasStructured) {
          const out: ExtractedResult = {
            results: parsed,
            confidencePct: 75,
            model: "gemini-2.5-flash",
          };
          const usage: any = (res as any).usage;
          if (usage) {
            out.usage = {
              promptTokens: usage.promptTokens ?? usage.inputTokens,
              completionTokens: usage.completionTokens ?? usage.outputTokens,
            };
          }
          return out;
        }
      } catch (err) {
        if (shouldLogRaw) {
          console.warn("[ai][google] direct extraction failed, falling back to text extraction", {
            typeSlug,
            error: (err as Error)?.message,
          });
        }
      }
    }
    
    // Text extraction path (works for both PDFs and images)
    try {
      const { generateText } = await import("ai")
      const t = await generateText({
        model: google("gemini-2.5-flash"),
        temperature: 0,
        messages: [
          { role: "system", content: "Extract ALL visible text from the document/image. Include headers, labels, scores, and descriptions." },
          { role: "user", content: [{ type: "file", data: bytes, mediaType: mimeType }] },
        ],
        maxOutputTokens: 2000,
      }) as any
      const plaintext = String(t.text || "").trim()
      if (shouldLogRaw) {
        console.info("[ai][google] extracted text", { length: plaintext.length, preview: plaintext.slice(0, 200) });
      }
      if (plaintext.length > 0) {
        const res3: any = await generateObject({
          model: google("gemini-2.5-flash"),
          schema,
          temperature: 0,
          messages: [
            { role: "system", content: "You are a data extraction expert. Extract structured data from the text and respond with ONLY valid JSON." },
            { role: "user", content: `Extract assessment data from this text. Return JSON with these fields if present:\n- type: personality type code\n- typeLabel: full name of type\n- variant: A or T\n- traits: object with mind, energy, nature, tactics, identity (0-100)\n- summary: brief description\n\nText:\n${plaintext.slice(0, 16000)}` },
          ],
          maxOutputTokens: 1000,
        })
        const obj3 = res3.object ?? {}
        if (shouldLogRaw) {
          console.info("[ai][google] text-based extraction", { keys: Object.keys(obj3), obj3 });
        }
        
        // Validate we got real data, not just schema placeholders
        const hasRealData = obj3 && (
          (typeof obj3.type === "string" && obj3.type.length > 1) ||
          (typeof obj3.typeLabel === "string" && obj3.typeLabel.length > 3) ||
          (obj3.traits && Object.keys(obj3.traits).length > 0)
        );
        
        if (hasRealData) {
          const usage: any = (res3 as any).usage;
          return { 
            results: obj3, 
            confidencePct: 70,
            model: "gemini-2.5-flash",
            usage: usage ? {
              promptTokens: usage.promptTokens ?? usage.inputTokens,
              completionTokens: usage.completionTokens ?? usage.outputTokens,
            } : undefined,
          }
        } else if (shouldLogRaw) {
          console.warn("[ai][google] extracted object has no real data", { obj3 });
        }
      }
    } catch (err2) {
      if (shouldLogRaw) {
        console.error("[ai][google] text extraction failed", { error: (err2 as Error)?.message });
      }
    }
    
    return { results: {}, confidencePct: 0 };
  },
};
