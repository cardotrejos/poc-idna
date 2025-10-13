/** Cloudflare Queues HTTP producer for AI ingest. */

function getEnv(name: string): string | undefined {
  return process.env[name]
}

export function isAIIngestQueueConfigured() {
  return Boolean(
    getEnv("CF_ACCOUNT_ID") &&
      getEnv("CF_API_TOKEN") &&
      getEnv("CF_AI_INGEST_QUEUE_ID"),
  )
}

export async function enqueueAIIngest(uploadId: number) {
  const accountId = getEnv("CF_ACCOUNT_ID")
  const apiToken = getEnv("CF_API_TOKEN")
  const queueId = getEnv("CF_AI_INGEST_QUEUE_ID")

  if (!accountId || !apiToken || !queueId) {
    throw new Error("Cloudflare Queues env not configured")
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/queues/${queueId}/messages`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ body: { uploadId } }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to enqueue message: ${res.status} ${text}`)
  }
}
