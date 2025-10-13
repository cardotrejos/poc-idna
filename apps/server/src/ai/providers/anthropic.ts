import type { AssessmentExtractor, ExtractedResult } from "./base"
import { getSchemaFor } from "../schemas"
import { generateText } from "ai"
// Optional dependency; ensure @ai-sdk/anthropic is installed
// eslint-disable-next-line import/no-extraneous-dependencies
import { anthropic } from "@ai-sdk/anthropic"

const MODEL = process.env.ANTHROPIC_VISION_MODEL || "claude-3-5-sonnet-2024-06-20"

export const anthropicExtractor: AssessmentExtractor = {
  async extract({ bytes, mimeType, typeSlug }): Promise<ExtractedResult> {
    const schema = getSchemaFor(typeSlug)
    try {
      const res = await generateText({
        model: anthropic(MODEL),
        messages: [
          { role: "system", content: "You extract structured data from assessment screenshots. Return ONLY valid JSON." },
          {
            role: "user",
            content: [
              { type: "text", text: `Extract fields for assessment type slug \"${typeSlug}\". Return only JSON.` },
              { type: "file", data: bytes, mediaType: mimeType },
            ],
          },
        ],
        maxOutputTokens: 400,
      })

      const raw = res.text || ""
      const start = raw.indexOf("{")
      const end = raw.lastIndexOf("}")
      let parsed: any = {}
      if (start >= 0 && end > start) {
        try {
          parsed = JSON.parse(raw.slice(start, end + 1))
        } catch {}
      }

      try {
        parsed = schema.parse(parsed)
      } catch {}

      const confidence = parsed && Object.keys(parsed).length > 0 ? 70 : 0
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
    } catch {
      return { results: {}, confidencePct: 0, model: MODEL }
    }
  },
}

