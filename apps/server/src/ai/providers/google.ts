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
            { role: "system", content: "From the provided text, extract structured JSON that matches the schema. Extract all available data." },
            { role: "user", content: [{ type: "text", text: plaintext.slice(0, 16000) }] },
          ],
          maxOutputTokens: 1000,
        })
        const obj3 = res3.object ?? {}
        if (shouldLogRaw) {
          console.info("[ai][google] text-based extraction", { keys: Object.keys(obj3), obj3 });
        }
        if (Object.keys(obj3).length > 0) {
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
