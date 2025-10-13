export interface Env {
  SLACK_WEBHOOK_URL?: string
}

export default {
  async queue(batch: any, env: Env) {
    const webhook = env.SLACK_WEBHOOK_URL
    for (const msg of batch.messages) {
      const payload = {
        text: `AI ingest DLQ message: ${msg.id}\n\n${safeString(msg.body)}`,
      }
      if (webhook) {
        try {
          await fetch(webhook, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          })
        } catch (e) {
          console.error("Failed to post Slack alert", e)
        }
      } else {
        console.warn("DLQ message (no SLACK_WEBHOOK_URL set)", payload.text)
      }
    }
  },
}

function safeString(v: unknown) {
  try {
    return typeof v === "string" ? v : JSON.stringify(v)
  } catch {
    return String(v)
  }
}

