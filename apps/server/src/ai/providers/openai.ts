import type { AssessmentExtractor, ExtractedResult } from "./base"
import { getSchemaFor } from "../schemas"
import { generateObject } from "ai"
// Optional dependency; ensure @ai-sdk/openai is installed in workspace
// eslint-disable-next-line import/no-extraneous-dependencies
import { openai } from "@ai-sdk/openai"

const MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini"

export const openAIExtractor: AssessmentExtractor = {
  async extract({ bytes, mimeType, typeSlug }): Promise<ExtractedResult> {
    const schema = getSchemaFor(typeSlug)
    const debugRaw = (process.env.AI_LOG_RAW || "").toLowerCase()
    const shouldLogRaw = debugRaw === "1" || debugRaw === "true"
    const isImage = /^image\//i.test(mimeType)
    const mediaPart = isImage
      ? ({ type: "image", image: Buffer.from(bytes).toString("base64") } as any)
      : ({ type: "file", data: bytes, mediaType: mimeType } as any)
    
    // Try direct extraction for images
    const isPdf = mimeType === "application/pdf";
    if (!isPdf) {
      try {
        const res = await generateObject({
          model: openai(MODEL),
          schema,
          temperature: 0,
          messages: [
            { role: "system", content: "Extract structured data for this assessment. Respond ONLY with valid JSON matching the schema. Extract all available fields even if some are missing." },
            {
              role: "user",
              content: [
                { type: "text", text: `Type slug: ${typeSlug}. Extract all data from this assessment document.` },
                mediaPart,
              ],
            },
          ],
          maxOutputTokens: 1000,
        })

        const parsed: any = (res as any).object ?? {}
        if (shouldLogRaw) {
          console.info("[ai][openai] direct extraction", { typeSlug, parsed })
        }

        // Validate we got real data, not just type metadata
        const hasRealData = parsed && (
          (typeof parsed.type === "string" && parsed.type.length > 1 && parsed.type !== "object") ||
          (typeof parsed.typeLabel === "string" && parsed.typeLabel.length > 3) ||
          (parsed.traits && Object.keys(parsed.traits).length > 0)
        );
        
        if (hasRealData) {
          const out: ExtractedResult = {
            results: parsed,
            confidencePct: 75,
            model: MODEL,
          }
          const usage: any = (res as any).usage
          if (usage) {
            out.usage = {
              promptTokens: usage.promptTokens ?? usage.inputTokens,
              completionTokens: usage.completionTokens ?? usage.outputTokens,
            }
          }
          return out
        }
      } catch (err) {
        if (shouldLogRaw) {
          console.warn("[ai][openai] direct extraction failed, falling back to text extraction", {
            typeSlug,
            error: (err as Error)?.message,
          })
        }
      }
    }
    
    // Text extraction path (works for both PDFs and images)
    try {
      const { generateText } = await import("ai")
      const t = await generateText({
        model: openai(MODEL),
        temperature: 0,
        messages: [
          { role: "system", content: "Extract ALL visible text from the document/image. Include headers, labels, scores, and descriptions." },
          { role: "user", content: [mediaPart] },
        ],
        maxOutputTokens: 2000,
      })
      const plaintext = String(t.text || "").trim()
      if (shouldLogRaw) {
        console.info("[ai][openai] extracted text", { length: plaintext.length, preview: plaintext.slice(0, 200) });
      }
      if (plaintext.length > 0) {
        const res3 = await generateObject({
          model: openai(MODEL),
          schema,
          temperature: 0,
          messages: [
            { role: "system", content: "You are a data extraction expert. Extract structured data from the text and respond with ONLY valid JSON." },
            { role: "user", content: `Extract assessment data from this text. Return JSON with these fields if present:\n- type: personality type code\n- typeLabel: full name of type\n- variant: A or T\n- traits: object with mind, energy, nature, tactics, identity (0-100)\n- summary: brief description\n\nText:\n${plaintext.slice(0, 16000)}` },
          ],
          maxOutputTokens: 1000,
        }) as any
        const obj3 = res3.object ?? {}
        if (shouldLogRaw) {
          console.info("[ai][openai] text-based extraction", { keys: Object.keys(obj3), obj3 });
        }
        
        // Validate we got real data
        const hasRealData = obj3 && (
          (typeof obj3.type === "string" && obj3.type.length > 1 && obj3.type !== "object") ||
          (typeof obj3.typeLabel === "string" && obj3.typeLabel.length > 3) ||
          (obj3.traits && Object.keys(obj3.traits).length > 0)
        );
        
        if (hasRealData) {
          return { results: obj3, confidencePct: 70, model: MODEL }
        } 
        if (shouldLogRaw) {
          console.warn("[ai][openai] extracted object has no real data", { obj3 });
        }
      }
    } catch (err2) {
      if (shouldLogRaw) {
        console.error("[ai][openai] text extraction failed", { error: (err2 as Error)?.message });
      }
    }
    
    return { results: {}, confidencePct: 0, model: MODEL }
  },
}
