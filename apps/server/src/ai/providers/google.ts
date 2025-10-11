import type { AssessmentExtractor, ExtractedResult } from "./base";
import { getSchemaFor } from "../schemas";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

// no-op

export const googleExtractor: AssessmentExtractor = {
  async extract({ bytes, mimeType: _mimeType, typeSlug }): Promise<ExtractedResult> {
    const schema = getSchemaFor(typeSlug);
    try {
      const res = await generateText({
        model: google("gemini-2.5-flash"),
        messages: [
          { role: "system", content: "You extract structured data from assessment screenshots. Return ONLY valid JSON." },
          {
            role: "user",
            content: [
              { type: "text", text: `Extract fields for assessment type slug "${typeSlug}". Return only JSON.` },
              { type: "file", data: bytes, mediaType: _mimeType },
            ],
          },
        ],
        maxOutputTokens: 400,
      });

      const raw = res.text || "";
      // Extract first JSON object in the response
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      let parsed: any = {};
      if (start >= 0 && end > start) {
        try {
          parsed = JSON.parse(raw.slice(start, end + 1));
        } catch {}
      }

      try {
        parsed = schema.parse(parsed);
      } catch {
        // leave as is for staff review
      }

      const confidence = parsed && Object.keys(parsed).length > 0 ? 70 : 0;
      return { results: parsed || {}, confidencePct: confidence };
    } catch {
      return { results: {}, confidencePct: 0 };
    }
  },
};
