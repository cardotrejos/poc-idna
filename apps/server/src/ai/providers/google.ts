import type { AssessmentExtractor, ExtractedResult } from "./base";
import { getSchemaFor } from "../schemas";

function toBase64(data: Uint8Array) {
  if (typeof Buffer !== "undefined") return Buffer.from(data).toString("base64");
  let binary = "";
  data.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

export const googleExtractor: AssessmentExtractor = {
  async extract({ bytes, mimeType: _mimeType, typeSlug }): Promise<ExtractedResult> {
    // Build a prompt asking for strict JSON according to the schema fields
    const schema = getSchemaFor(typeSlug);
    void toBase64(bytes); // keep unused helper referenced for now

    // TODO: Wire to AI SDK generate call with image input; for now, return empty result so staff can review.
    schema; // keep referenced to avoid unused warning
    return { results: {}, confidencePct: 0 };
  },
};
