AI SDK Document Analysis (PDF + Images)

Endpoints
- POST `/uploads/documents/:id/analyze?task=auto|summary|kv|full`
  - Requires the same permissions as preview/delete.
  - Returns `{ object, provider, model, usage, confidencePct }`.

How it works
- Uses Vercel AI SDK `generateObject` with multimodal `file` inputs.
- Provider chain is controlled via env:
  - `AI_PROVIDER` (default: `google`)
  - `AI_PROVIDER_CHAIN` (comma list like `google,openai,anthropic`)
  - `OPENAI_VISION_MODEL`, `ANTHROPIC_VISION_MODEL` to override defaults.
  - `AI_CONFIDENCE_MIN` (default: 60) for early-exit across providers.
  - `AI_LOG_RAW=1` to log keys of returned object and failures.

Schema
- Generic schema captures summary, key/value facts, entities, sections, and tables.
- You can override the schema per-call in code if needed (`analyzeDocument({ schema })`).

Notes
- For PDFs, bytes are sent as a `file` part with `mediaType: application/pdf`.
- For images (JPEG/PNG), bytes are sent as a `file` part as well.
- We do not persist results yet; this endpoint is on-demand to avoid DB changes.

