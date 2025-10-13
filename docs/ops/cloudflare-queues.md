Cloudflare Queues + Worker consumer for AI ingest

Overview
- Upload API enqueues `{ uploadId }` to a Cloudflare Queue.
- A Worker consumer reads messages and POSTs to the server’s `POST /internal/ingest/:id` endpoint.
- In dev or if env is missing, the server falls back to inline processing.
- Stage 2 (optional): The Worker can perform edge-native inference using Workers AI and read bytes directly from R2, then POST the parsed output back with `/internal/ingest/complete`.

Relevant files
- apps/server/src/api/assessments/upload.ts (enqueue trigger)
- apps/server/src/api/internal/ingest.ts (secured internal endpoint)
- apps/server/src/lib/queues.ts (HTTP producer to CF API)
- apps/worker-ai-ingest/wrangler.toml (Worker + queue binding)
- apps/worker-ai-ingest/src/index.ts (queue consumer)

Provisioning (once)
1) Create the queue
   wrangler queues create idna-ai-ingest

2) Capture identifiers
   - CF_ACCOUNT_ID: `wrangler whoami`
   - CF_AI_INGEST_QUEUE_ID: `wrangler queues list` → use the queue ID or name

3) Deploy the consumer worker
   - Edit apps/worker-ai-ingest/wrangler.toml → set queue = "idna-ai-ingest"
   - wrangler secret put INTERNAL_API_SECRET (same as server env)
   - wrangler deploy apps/worker-ai-ingest

4) Server-side env (Railway)
   - CF_ACCOUNT_ID
   - CF_AI_INGEST_QUEUE_ID (queue ID or name)
   - CF_API_TOKEN (API token with Queues Write permission)
   - INTERNAL_API_SECRET (shared with Worker)
   - INTERNAL_INGEST_BASE_URL (Worker uses this to call the server; set in worker vars)

5) Worker vars
   - INTERNAL_INGEST_BASE_URL (e.g., https://api.yourdomain.tld)
   - INTERNAL_API_SECRET (secret; must match server)

Notes
- Concurrency & retries are configured in wrangler.toml [[queues.consumers]].
- Observability: use `wrangler tail` for Worker logs, and server logs on Railway. Queues provides DLQ options; enable if needed.
- Future: migrate ingest into the Worker (read from R2 and use Workers AI) or wrap the steps in Cloudflare Workflows. No API contract changes required.

Stage 2: Edge-native inference (optional)
- Enable R2 and AI bindings in `apps/worker-ai-ingest/wrangler.toml` (already scaffolded):
  - `[[r2_buckets]] binding = "R2"` with `bucket_name` matching your R2 bucket
  - `[ai] binding = "AI"`
- Set Worker vars:
  - `USE_EDGE_INGEST=true`
  - `WORKERS_AI_MODEL=@cf/llama-3.2-11b-vision-instruct` (or your preferred model)
- Worker flow:
  1) GET `/internal/ingest/meta/:id` for { storageKey, mime, typeSlug }
  2) `env.R2.get(storageKey)` to load bytes
  3) `env.AI.run(model, { messages: [...] })` to produce JSON text
  4) POST `/internal/ingest/complete` with `{ uploadId, typeId, typeSlug, rawText }`
- Server validates against the known Zod schema and persists results, mirroring `processUpload`.
