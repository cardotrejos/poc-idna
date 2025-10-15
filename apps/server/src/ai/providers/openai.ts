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
        console.info("[ai][openai] object", { typeSlug, parsed })
      }

      const hasStructured = parsed && Object.keys(parsed).length > 0
      const confidence = hasStructured ? 70 : 0
      const out: ExtractedResult = {
        results: parsed || {},
        confidencePct: confidence,
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
    } catch (err) {
      if (shouldLogRaw) {
        console.warn("[ai][openai] structured output failed", {
          typeSlug,
          error: (err as Error)?.message,
          stack: (err as Error)?.stack?.slice(0, 500),
        })
      }
      // Secondary attempt: transcribe visible text first, then structure
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
              { role: "system", content: "From the provided text, extract structured JSON that matches the schema. Extract all available data." },
              { role: "user", content: [{ type: "text", text: plaintext.slice(0, 16000) }] },
            ],
            maxOutputTokens: 1000,
          }) as any
          const obj3 = res3.object ?? {}
          if (shouldLogRaw) {
            console.info("[ai][openai] secondary extraction", { keys: Object.keys(obj3), obj3 });
          }
          if (Object.keys(obj3).length > 0) {
            return { results: obj3, confidencePct: 65, model: MODEL }
          }
        }
      } catch (err2) {
        if (shouldLogRaw) {
          console.error("[ai][openai] secondary attempt failed", { error: (err2 as Error)?.message });
        }
      }
      return { results: {}, confidencePct: 0, model: MODEL }
    }
  },
}
