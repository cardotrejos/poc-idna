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
    try {
      const res = await generateObject({
        model: google("gemini-2.5-flash"),
        schema,
        temperature: 0,
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
      });

      const parsed = (res as any).object ?? {};
      if (shouldLogRaw) {
        console.info("[ai][google] object keys", { typeSlug, keys: Object.keys(parsed || {}) });
      }

      const hasStructured = parsed && Object.keys(parsed).length > 0;
      const confidence = hasStructured ? 70 : 0;
      const out: ExtractedResult = {
        results: parsed || {},
        confidencePct: confidence,
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
    } catch (err) {
      // Secondary attempt: transcribe visible text first, then structure
      try {
        const { generateText } = await import("ai")
        const t = await generateText({
          model: google("gemini-2.5-flash"),
          temperature: 0,
          messages: [
            { role: "system", content: "Extract ONLY the visible text from the document/image. No commentary." },
            {
              role: "user",
              content: [
                { type: "file", data: bytes, mediaType: mimeType },
              ],
            },
          ],
          maxOutputTokens: 500,
        }) as any
        const plaintext = String(t.text || "").trim()
        if (plaintext.length > 0) {
          const res3: any = await generateObject({
            model: google("gemini-2.5-flash"),
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
            return { results: obj3, confidencePct: 65, model: "gemini-2.5-flash" }
          }
        }
      } catch {}
      // Fallback: try plain JSON prompting via generateText and parse
      if (shouldLogRaw) {
        console.warn("[ai][google] structured output failed; falling back to JSON text parse", {
          typeSlug,
          error: (err as Error)?.message,
        });
      }
      try {
        const { generateText } = await import("ai");
        const res2: any = await generateText({
          model: google("gemini-2.5-flash"),
          messages: [
            { role: "system", content: "Return ONLY valid JSON. No prose." },
            {
              role: "user",
              content: [
                { type: "text", text: `Type slug: ${typeSlug}. Return ONLY JSON matching the intended schema.` },
                { type: "file", data: bytes, mediaType: mimeType },
              ],
            },
          ],
          maxOutputTokens: 400,
        });
        const raw = String(res2.text || "");
        const s = raw.indexOf("{");
        const e = raw.lastIndexOf("}");
        let parsed: any = {};
        if (s >= 0 && e > s) {
          try { parsed = JSON.parse(raw.slice(s, e + 1)); } catch {}
        }
        try { parsed = schema.parse(parsed); } catch {}
        const ok = parsed && Object.keys(parsed).length > 0;
        return { results: ok ? parsed : {}, confidencePct: ok ? 60 : 0, model: "gemini-2.5-flash" };
      } catch (err2) {
        if (shouldLogRaw) {
          console.error("[ai][google] fallback parse also failed", { typeSlug, error: (err2 as Error)?.message });
        }
        return { results: {}, confidencePct: 0 };
      }
    }
  },
};
