import test from "node:test";
import assert from "node:assert/strict";
import { googleExtractor } from "../../src/ai/providers/google";

// 1x1 transparent PNG
const ONE_BY_ONE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAGgwJ/lkq3GQAAAABJRU5ErkJggg==";

function getFixtureBytes(): Uint8Array {
  try {
    return Buffer.from(ONE_BY_ONE_PNG_BASE64, "base64");
  } catch {
    return new Uint8Array();
  }
}

test("googleExtractor returns object shape (skips without API key)", async (t) => {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    t.skip("GOOGLE_GENERATIVE_AI_API_KEY not set, skipping live AI call");
    return;
  }

  const bytes = getFixtureBytes();
  const out = await googleExtractor.extract({
    bytes,
    mimeType: "image/png",
    typeSlug: "16p",
  });

  assert.equal(typeof out, "object");
  assert.equal(typeof out.confidencePct, "number");
  assert.ok(out.confidencePct >= 0 && out.confidencePct <= 100);
  assert.equal(typeof out.results, "object");
});

