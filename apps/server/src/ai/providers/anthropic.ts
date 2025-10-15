import type { AssessmentExtractor, ExtractedResult } from "./base"
import { getSchemaFor } from "../schemas"
import { generateObject } from "ai"
// Optional dependency; ensure @ai-sdk/anthropic is installed
// eslint-disable-next-line import/no-extraneous-dependencies
import { anthropic } from "@ai-sdk/anthropic"

const MODEL = process.env.ANTHROPIC_VISION_MODEL || "claude-3-5-sonnet-2024-06-20"

export const anthropicExtractor: AssessmentExtractor = {
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
        model: anthropic(MODEL),
        schema,
        temperature: 0,
        messages: [
          { role: "system", content: "Extract structured data for this assessment. Respond ONLY with valid JSON matching the schema." },
          {
            role: "user",
            content: [
              { type: "text", text: `Type slug: ${typeSlug}` },
              mediaPart,
            ],
          },
        ],
        maxOutputTokens: 400,
      })

      const parsed: any = (res as any).object ?? {}
      if (shouldLogRaw) {
        console.info("[ai][anthropic] object keys", { typeSlug, keys: Object.keys(parsed || {}) })
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
        console.error("[ai][anthropic] extractor threw; returning empty results", {
          typeSlug,
          error: (err as Error)?.message,
        })
      }
      // Secondary attempt: transcribe visible text first, then structure
      try {
        const { generateText } = await import("ai")
        const t = await generateText({
          model: anthropic(MODEL),
          temperature: 0,
          messages: [
            { role: "system", content: "Extract ONLY the visible text from the document/image. No commentary." },
            { role: "user", content: [mediaPart] },
          ],
          maxOutputTokens: 500,
        })
        const plaintext = String(t.text || "").trim()
        if (plaintext.length > 0) {
          const res3: any = await generateObject({
            model: anthropic(MODEL),
            schema,
            temperature: 0,
            messages: [
              { role: "system", content: "From the provided text, extract structured JSON that matches the schema. Respond ONLY JSON." },
              { role: "user", content: [{ type: "text", text: plaintext.slice(0, 8000) }] },
            ],
            maxOutputTokens: 400,
          })
          const obj3 = res3.object ?? {}
          if (Object.keys(obj3).length > 0) {
            return { results: obj3, confidencePct: 65, model: MODEL }
          }
        }
      } catch {}
      if (shouldLogRaw) {
        console.warn("[ai][anthropic] structured output failed; falling back to JSON text parse", {
          typeSlug,
          error: (err as Error)?.message,
        })
      }
      try {
        const { generateText } = await import("ai")
        const res2: any = await generateText({
          model: anthropic(MODEL),
          messages: [
            { role: "system", content: "Return ONLY valid JSON. No prose." },
            { role: "user", content: [{ type: "text", text: `Type slug: ${typeSlug}. Return ONLY JSON matching the intended schema.` }, mediaPart] },
          ],
          maxOutputTokens: 400,
        })
        const raw = String(res2.text || "")
        const s = raw.indexOf("{")
        const e = raw.lastIndexOf("}")
        let parsed: any = {}
        if (s >= 0 && e > s) {
          try { parsed = JSON.parse(raw.slice(s, e + 1)) } catch {}
        }
        try { parsed = schema.parse(parsed) } catch {}
        const ok = parsed && Object.keys(parsed).length > 0
        return { results: ok ? parsed : {}, confidencePct: ok ? 60 : 0, model: MODEL }
      } catch (err2) {
        if (shouldLogRaw) {
          console.error("[ai][anthropic] fallback parse also failed", { typeSlug, error: (err2 as Error)?.message })
        }
        return { results: {}, confidencePct: 0, model: MODEL }
      }
    }
  },
}
