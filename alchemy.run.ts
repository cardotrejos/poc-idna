/// <reference types="@types/node" />
import dotenv from "dotenv"
import { existsSync } from "node:fs"
import { resolve } from "node:path"
import alchemy from "alchemy"
import { Queue, Worker, R2Bucket } from "alchemy/cloudflare"

// Load env files with stage overrides
const stage = process.env.ALCHEMY_STAGE || "dev"
dotenv.config({ path: resolve(process.cwd(), ".env") })
const load = (p: string) => {
  const abs = resolve(process.cwd(), p)
  if (existsSync(abs)) dotenv.config({ path: abs, override: true })
}
load(`.env.local`)
load(`.env.${stage}`)
load(`.env.${stage}.local`)

// Allow CF_* aliases commonly used elsewhere in the repo
if (!process.env.CLOUDFLARE_API_TOKEN && process.env.CF_API_TOKEN) {
  process.env.CLOUDFLARE_API_TOKEN = process.env.CF_API_TOKEN
}
if (!process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CF_ACCOUNT_ID) {
  process.env.CLOUDFLARE_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
}

// Preflight checks with helpful guidance
if (!process.env.CLOUDFLARE_API_TOKEN && !process.env.CLOUDFLARE_API_KEY) {
  console.error(
    [
      `Stage: ${stage}`,
      "Missing Cloudflare credentials.",
      "Set one of:",
      "  - CLOUDFLARE_API_TOKEN (recommended)",
      "  - CLOUDFLARE_API_KEY and CLOUDFLARE_EMAIL (legacy)",
      "Optionally set CLOUDFLARE_ACCOUNT_ID to skip account discovery.",
      "Token scopes (minimum for this project):",
      "  - Account: Workers Scripts:Edit",
      "  - Account: Queues:Edit",
      "  - (Optional but recommended) Account: R2:Edit",
      "  - (If not setting CLOUDFLARE_ACCOUNT_ID) Account: Read to allow account discovery",
    ].join("\n"),
  )
  process.exit(1)
}

// Alchemy app scope
const app = await alchemy("idna-infra", {
  stage,
  phase: process.argv.includes("--destroy") ? "destroy" : "up",
  // Needed if you use alchemy.secret(...)
  password: process.env.ALCHEMY_PASSWORD,
})

// R2 bucket binding (adopts existing if already created)
const r2 = await R2Bucket("ingest-r2", {
  name: process.env.R2_BUCKET || "idna-dev",
  adopt: true,
})

// Durable queue for AI ingest
export const aiIngestQueue = await Queue<{ uploadId: number }>("ai-ingest", {
  name: process.env.CF_AI_INGEST_QUEUE_NAME || "idna-ai-ingest",
  // Example settings; tweak as needed
  settings: {
    // seconds to retain messages; defaults CF-side if omitted
    messageRetentionPeriod: 24 * 60 * 60,
    deliveryPaused: false,
  },
  adopt: true,
})

// Dead-letter queue
export const aiIngestDLQ = await Queue("ai-ingest-dlq", {
  name: process.env.CF_AI_INGEST_DLQ_NAME || "idna-ai-ingest-dlq",
  adopt: true,
})

// Worker consumer that processes batches from the queue
const aiIngestWorkerBindings: Record<string, unknown> = {
  R2: r2,
  INTERNAL_INGEST_BASE_URL: process.env.INTERNAL_INGEST_BASE_URL || "",
}

if (process.env.INTERNAL_API_SECRET) {
  // Encrypt secret via Alchemy only when provided
  aiIngestWorkerBindings.INTERNAL_API_SECRET = alchemy.secret(
    process.env.INTERNAL_API_SECRET,
  )
}

export const aiIngestWorker = await Worker("ai-ingest-consumer", {
  name: process.env.CF_AI_INGEST_CONSUMER_NAME || "idna-ai-ingest-consumer",
  entrypoint: "./apps/worker-ai-ingest/src/index.ts",
  // Bindings available on env.* in the Worker
  bindings: aiIngestWorkerBindings,
  // Attach the queue as a push consumer
  eventSources: [
    {
      queue: aiIngestQueue,
      settings: {
        batchSize: Number(process.env.CF_AI_INGEST_BATCH_SIZE || 10),
        maxRetries: Number(process.env.CF_AI_INGEST_MAX_RETRIES || 3),
        maxWaitTimeMs: Number(process.env.CF_AI_INGEST_MAX_WAIT_MS || 2000),
        deadLetterQueue: aiIngestDLQ,
      },
    },
  ],
  adopt: true,
})

// DLQ consumer for alerts
const aiIngestDlqWorkerBindings: Record<string, unknown> = {}

if (process.env.SLACK_WEBHOOK_URL) {
  aiIngestDlqWorkerBindings.SLACK_WEBHOOK_URL = alchemy.secret(
    process.env.SLACK_WEBHOOK_URL,
  )
}

export const aiIngestDlqWorker = await Worker("ai-ingest-dlq-consumer", {
  name: process.env.CF_AI_INGEST_DLQ_CONSUMER_NAME || "idna-ai-ingest-dlq-consumer",
  entrypoint: "./apps/worker-ai-ingest/src/dlq.ts",
  bindings: aiIngestDlqWorkerBindings,
  eventSources: [
    {
      queue: aiIngestDLQ,
      settings: {
        batchSize: 10,
        maxRetries: 1,
        maxWaitTimeMs: 2000,
      },
    },
  ],
  adopt: true,
})

console.log({
  queue: aiIngestQueue.name,
  dlq: aiIngestDLQ.name,
  worker: aiIngestWorker.name,
  dlqWorker: aiIngestDlqWorker.name,
  // @ts-ignore
  url: (aiIngestWorker as any).url,
})

await app.finalize()
