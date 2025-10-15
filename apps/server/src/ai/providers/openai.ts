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
    try {
      const res = await generateObject({
        model: openai(MODEL),
        schema,
        messages: [
          { role: "system", content: "Extract structured data for this assessment. Respond ONLY with valid JSON matching the schema." },
          {
            role: "user",
            content: [
              { type: "text", text: `Type slug: ${typeSlug}` },
              { type: "file", data: bytes, mediaType: mimeType },
            ],
          },
        ],
        maxOutputTokens: 400,
      })

      const parsed: any = (res as any).object ?? {}
      if (shouldLogRaw) {
        console.info("[ai][openai] object keys", { typeSlug, keys: Object.keys(parsed || {}) })
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
        console.error("[ai][openai] extractor threw; returning empty results", {
          typeSlug,
          error: (err as Error)?.message,
        })
      }
      return { results: {}, confidencePct: 0, model: MODEL }
    }
  },
}
