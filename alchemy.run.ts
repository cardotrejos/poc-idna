/// <reference types="@types/node" />
import alchemy from "alchemy"
import { Queue, Worker, R2Bucket } from "alchemy/cloudflare"

// Alchemy app scope
const app = await alchemy("idna-infra", {
  stage: process.env.ALCHEMY_STAGE || "dev",
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
export const aiIngestWorker = await Worker("ai-ingest-consumer", {
  name: process.env.CF_AI_INGEST_CONSUMER_NAME || "idna-ai-ingest-consumer",
  entrypoint: "./apps/worker-ai-ingest/src/index.ts",
  // Bindings available on env.* in the Worker
  bindings: {
    R2: r2,
    INTERNAL_INGEST_BASE_URL: process.env.INTERNAL_INGEST_BASE_URL || "",
    // Store secret encrypted in Alchemy state if ALCHEMY_PASSWORD is set
    INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET
      ? alchemy.secret(process.env.INTERNAL_API_SECRET)
      : undefined,
    // Note: Workers AI binding (env.AI) is not configured here.
    // If you enable Stage 2 edge inference, add an AI binding via Alchemy
    // once supported, or keep the wrangler.toml [ai] binding in the worker folder.
  },
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
export const aiIngestDlqWorker = await Worker("ai-ingest-dlq-consumer", {
  name: process.env.CF_AI_INGEST_DLQ_CONSUMER_NAME || "idna-ai-ingest-dlq-consumer",
  entrypoint: "./apps/worker-ai-ingest/src/dlq.ts",
  bindings: {
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL
      ? alchemy.secret(process.env.SLACK_WEBHOOK_URL)
      : undefined,
  },
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
