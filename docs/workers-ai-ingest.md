Workers-Based AI Ingest (Cloudflare)

Overview
- Goal: decouple AI extraction from the upload request and run it as a background job with durable retries.
- Platform: Cloudflare Queues + a consumer Worker. Optionally, the Worker can perform inference using Workers AI and read bytes directly from R2 (Stage 2).

Architecture
- Stage 1 (default):
  1) Server enqueues `{ uploadId }` to Cloudflare Queues.
  2) Worker consumes messages and calls `POST /internal/ingest/:id` on the server with `X-Internal-Secret`.
  3) Server runs existing `processUpload(id)` using current provider (Google by default) and persists results.
- Stage 2 (opt-in):
  1) Worker GETs `/internal/ingest/meta/:id` to obtain `{ storageKey, mime, typeSlug, typeId }`.
  2) Worker reads bytes from `env.R2` and calls `env.AI.run(model, messages=[image + prompt])`.
  3) Worker POSTs `/internal/ingest/complete` to let the server validate against Zod schema and persist results + usage.

Key Files
- apps/server/src/api/assessments/upload.ts → enqueue on successful upload
- apps/server/src/api/internal/ingest.ts → internal endpoints (secured)
- apps/server/src/lib/queues.ts → Cloudflare Queues producer (REST API)
- apps/worker-ai-ingest/wrangler.toml → Worker config (queue, R2, AI bindings)
- apps/worker-ai-ingest/src/index.ts → queue handler (Stage 1 + Stage 2)
- docs/ops/cloudflare-queues.md → detailed setup and commands

Environment
- Server (Railway):
  - `CF_ACCOUNT_ID` (from `wrangler whoami`)
  - `CF_AI_INGEST_QUEUE_ID` (name or ID from `wrangler queues list`)
  - `CF_API_TOKEN` (token with Queues:Write)
  - `INTERNAL_API_SECRET` (shared with Worker)
- Worker (Cloudflare):
  - `INTERNAL_INGEST_BASE_URL` (server origin)
  - `INTERNAL_API_SECRET` (secret; must match server)
  - Stage 2 only: `USE_EDGE_INGEST=true`, `WORKERS_AI_MODEL=@cf/llama-3.2-11b-vision-instruct`, R2 and AI bindings enabled in wrangler.toml

Deploy Quickstart
1) Create queue: `wrangler queues create idna-ai-ingest`
2) Set Worker vars/secrets: `wrangler secret put INTERNAL_API_SECRET`; `wrangler vars set INTERNAL_INGEST_BASE_URL=https://<server-origin>`
3) Update `wrangler.toml` queue name and R2 bucket if needed
4) Deploy Worker: `cd apps/worker-ai-ingest && wrangler deploy`
5) Set Railway env vars (server). Redeploy server.
6) Test upload, tail Worker logs: `wrangler tail idna-ai-ingest-consumer`

Observability & Ops
- Retries/concurrency: configured in `wrangler.toml` → `[[queues.consumers]]`.
- Logs: `wrangler tail` for Worker; Railway logs for server.
- Add a DLQ and a failure webhook if needed.

Notes/Tradeoffs
- Cloudflare Queues avoids running Redis/BullMQ and sits close to R2.
- Stage 1 minimizes risk (reuses server provider + logic). Stage 2 moves compute to edge but keeps server as source of truth.
- Both stages preserve a single persistence path: server validates with Zod and writes to DB.

