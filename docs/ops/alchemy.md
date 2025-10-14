Alchemy (IaC) for Cloudflare Queue + Worker

Why
- Keep queue/worker provisioning in code, reproducible across envs.
- One command to create/update/destroy infra.

Files
- alchemy.run.ts — declares R2 bucket (adopt), Queue, Worker + queue consumer binding.

Preflight checklist
- Tools
  - bun installed (we run `bun run infra:up`)
  - wrangler optional (not required if you provide `CLOUDFLARE_API_TOKEN`)
- Required environment (export in the shell you run Alchemy from)
  - `CLOUDFLARE_API_TOKEN` — CF API token with Workers Scripts:Edit + Queues:Edit (Account scope)
  - `INTERNAL_INGEST_BASE_URL` — e.g. `https://api.your-domain.com`
  - `INTERNAL_API_SECRET` — long random string (shared with server)
- Optional environment
  - `CF_AI_INGEST_QUEUE_NAME` — defaults to `idna-ai-ingest`
  - `R2_BUCKET` — defaults to `idna-dev`
  - `SLACK_WEBHOOK_URL` — enables DLQ alert worker to post failures
  - `ALCHEMY_PASSWORD` — to encrypt secrets passed via `alchemy.secret(...)`
  - Tuning: `CF_AI_INGEST_BATCH_SIZE`, `CF_AI_INGEST_MAX_RETRIES`, `CF_AI_INGEST_MAX_WAIT_MS`

Example exports
```
export CLOUDFLARE_API_TOKEN=cf_***
export INTERNAL_INGEST_BASE_URL=https://api.example.com
export INTERNAL_API_SECRET=$(openssl rand -hex 32)
export CF_AI_INGEST_QUEUE_NAME=idna-ai-ingest
export R2_BUCKET=idna-dev
# Optional alerts
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/Txxxx/Bxxxx/xxxx
```

Usage
- Upsert infra: `bun run infra:up`
- Destroy infra: `bun run infra:destroy`

Notes
- The Worker uses our existing source: `apps/worker-ai-ingest/src/index.ts`.
- Stage 1 requires only R2 + internal URL/secret bindings.
- Stage 2 (Workers AI) would require adding an `[ai]` binding in wrangler.toml. We intentionally omit it by default; keep `USE_EDGE_INGEST=false`.
- Alchemy resources are created with `adopt: true`, so it can take control of existing queue/bucket/worker if you already provisioned them.

After provisioning (server on Railway or local dev server)
- Set the producer/env variables used by the server to enqueue messages via REST:
  - `CF_ACCOUNT_ID` — from Cloudflare (or `wrangler whoami`)
  - `CF_AI_INGEST_QUEUE_ID` — queue name or ID (Alchemy output or CF dashboard)
  - `CF_API_TOKEN` — same token used above
  - `INTERNAL_API_SECRET` — same as provisioned for worker
- Choose your AI provider (top LLMs on server):
  - `AI_PROVIDER=openai|anthropic|google`
  - `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` accordingly
  - Optional: `AI_CONFIDENCE_MIN` (default 60), `AI_PROVIDER_CHAIN` (e.g., `openai,anthropic,google`), `AI_REQUEUE_ON_LOW_CONFIDENCE=true`

Verification
- `bun run infra:up` outputs resource names; confirm in Cloudflare dashboard (Queues and Workers).
- Tail consumer logs: `wrangler tail idna-ai-ingest-consumer` (optional)
- Upload a test assessment → verify: message consumed, server `/internal/ingest/:id` called, DB rows in `assessment_results` and `ai_calls` created, `assessment_uploads.status=needs_review`.
  - Server logs now emit `[queues]` lines showing whether the queue config is complete and each enqueue attempt.
