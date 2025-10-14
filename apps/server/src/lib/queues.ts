/** Cloudflare Queues HTTP producer for AI ingest. */

const ALIASES: Record<string, string[]> = {
  CF_ACCOUNT_ID: ["CLOUDFLARE_ACCOUNT_ID"],
  CF_API_TOKEN: ["CLOUDFLARE_API_TOKEN"],
  CF_AI_INGEST_QUEUE_ID: [
    "CLOUDFLARE_AI_INGEST_QUEUE_ID",
    "CF_AI_INGEST_QUEUE_NAME",
    "CLOUDFLARE_AI_INGEST_QUEUE_NAME",
  ],
}

function getEnv(name: string): string | undefined {
  const direct = process.env[name]
  if (direct) return direct
  const aliasList = ALIASES[name] || []
  for (const alias of aliasList) {
    const value = process.env[alias]
    if (value) return value
  }
  return undefined
}

function resolveQueueConfig() {
  const accountId = getEnv("CF_ACCOUNT_ID")
  const apiToken = getEnv("CF_API_TOKEN")
  const queueId = getEnv("CF_AI_INGEST_QUEUE_ID")

  const missing: string[] = []
  if (!accountId) missing.push("CF_ACCOUNT_ID")
  if (!apiToken) missing.push("CF_API_TOKEN")
  if (!queueId) missing.push("CF_AI_INGEST_QUEUE_ID")

  return { accountId, apiToken, queueId, missing }
}

function logStatus(message: string, meta?: Record<string, unknown>) {
  if (meta) {
    console.info(`[queues] ${message}`, meta)
  } else {
    console.info(`[queues] ${message}`)
  }
}

export function isAIIngestQueueConfigured() {
  const { missing } = resolveQueueConfig()
  if (missing.length > 0) {
    logStatus("AI ingest queue not fully configured", { missing })
    return false
  }
  return true
}

export async function enqueueAIIngest(uploadId: number) {
  const { accountId, apiToken, queueId, missing } = resolveQueueConfig()

  if (!accountId || !apiToken || !queueId) {
    logStatus("Skipping queue enqueue; env incomplete", { uploadId, missing })
    throw new Error("Cloudflare Queues env not configured")
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/queues/${queueId}/messages`
  const started = Date.now()
  logStatus("Enqueueing AI ingest message", { uploadId, queueId })
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      body: { uploadId },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to enqueue message: ${res.status} ${text}`)
  }

  const elapsed = Date.now() - started
  logStatus("Enqueued AI ingest message", { uploadId, queueId, elapsedMs: elapsed })
}
