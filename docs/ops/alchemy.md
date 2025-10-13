Alchemy (IaC) for Cloudflare Queue + Worker

Why
- Keep queue/worker provisioning in code, reproducible across envs.
- One command to create/update/destroy infra.

Files
- alchemy.run.ts — declares R2 bucket (adopt), Queue, Worker + queue consumer binding.

Prereqs
- Install Alchemy CLI: https://alchemy.run/docs/getting-started
- Cloudflare auth: `wrangler login` or set `CLOUDFLARE_API_TOKEN`.
- Optional encryption: set `ALCHEMY_PASSWORD` to use `alchemy.secret(...)`.

Env (local shell when running alchemy)
- `INTERNAL_INGEST_BASE_URL=https://api.yourdomain.tld`
- `INTERNAL_API_SECRET=...` (if using alchemy.secret)
- `R2_BUCKET=idna-dev` (or your bucket)
- `CF_AI_INGEST_QUEUE_NAME=idna-ai-ingest`
- Optional tuning: `CF_AI_INGEST_BATCH_SIZE`, `CF_AI_INGEST_MAX_RETRIES`, `CF_AI_INGEST_MAX_WAIT_MS`

Usage
- Upsert infra: `bun run infra:up`
- Destroy infra: `bun run infra:destroy`

Notes
- The Worker uses our existing source: `apps/worker-ai-ingest/src/index.ts`.
- Stage 1 requires only R2 + internal URL/secret bindings.
- Stage 2 (Workers AI) would require adding an `[ai]` binding in wrangler.toml. We intentionally omit it by default; keep `USE_EDGE_INGEST=false`.
- Alchemy resources are created with `adopt: true`, so it can take control of existing queue/bucket/worker if you already provisioned them.
