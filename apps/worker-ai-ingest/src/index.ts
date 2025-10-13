export interface Env {
  INTERNAL_INGEST_BASE_URL: string
  INTERNAL_API_SECRET: string
  USE_EDGE_INGEST?: string
  WORKERS_AI_MODEL?: string
  R2: R2Bucket
  AI: any
}

type IngestMessage = {
  uploadId: number
}

export default {
  // Queue consumer entrypoint
  async queue(batch: any, env: Env, ctx: any) {
    const base = env.INTERNAL_INGEST_BASE_URL.replace(/\/$/, "")

    let hadFailure = false

    for (const msg of batch.messages) {
      try {
        let parsed: IngestMessage
        if (typeof msg.body === "string") {
          try {
            parsed = JSON.parse(msg.body) as IngestMessage
          } catch {
            throw new Error("Message body not JSON")
          }
        } else {
          parsed = msg.body as IngestMessage
        }

        const { uploadId } = parsed
        if (!uploadId || typeof uploadId !== "number") {
          throw new Error("Invalid message body: missing uploadId")
        }

        const useEdge = (env.USE_EDGE_INGEST || "").toLowerCase() === "true"
        if (!useEdge) {
          await callServerIngest(base, env, uploadId)
        } else {
          await runEdgeIngest(base, env, uploadId)
        }
      } catch (err) {
        // Allow batch retry
        hadFailure = true
        // Log for observability in Workers tail
        console.error("AI ingest message failed", {
          id: msg.id,
          error: (err as Error)?.message,
        })
      }
    }

    if (hadFailure) {
      throw new Error("One or more messages failed; requeueing batch")
    }
  },
}

async function callServerIngest(base: string, env: Env, uploadId: number) {
  const url = `${base}/internal/ingest/${uploadId}`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-secret": env.INTERNAL_API_SECRET,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Internal ingest failed: ${res.status} ${text}`)
  }
}

async function runEdgeIngest(base: string, env: Env, uploadId: number) {
  // 1) Fetch metadata
  const metaRes = await fetch(`${base}/internal/ingest/meta/${uploadId}`, {
    headers: { "x-internal-secret": env.INTERNAL_API_SECRET },
  })
  if (!metaRes.ok) throw new Error(`meta fetch failed: ${metaRes.status}`)
  const meta = (await metaRes.json()) as {
    uploadId: number
    storageKey: string
    mime: string
    typeId: number
    typeSlug: string
  }

  // 2) Read bytes from R2
  const obj = await env.R2.get(meta.storageKey)
  if (!obj) throw new Error(`R2 object not found for key ${meta.storageKey}`)
  const bytes = new Uint8Array(await obj.arrayBuffer())

  // 3) Run Workers AI (simple JSON-only prompt)
  const model = env.WORKERS_AI_MODEL || "@cf/llama-3.2-11b-vision-instruct"
  let rawText = ""
  try {
    const payload: any = {
      messages: [
        { role: "system", content: "Extract JSON only. No prose. Strict JSON." },
        {
          role: "user",
          content: [
            { type: "text", text: `Extract fields for assessment type slug "${meta.typeSlug}". Respond with ONLY JSON.` },
            { type: "input_image", image: [...bytes], mime_type: meta.mime },
          ],
        },
      ],
      max_tokens: 400,
    }
    const result: any = await env.AI.run(model, payload)
    rawText = typeof result?.response === "string" ? result.response : (result?.text || "")
  } catch (e: any) {
    console.error("Workers AI error", e?.message || e)
  }

  // 4) Send to server for validation & persistence
  const persistRes = await fetch(`${base}/internal/ingest/complete`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-secret": env.INTERNAL_API_SECRET,
    },
    body: JSON.stringify({
      uploadId: meta.uploadId,
      typeId: meta.typeId,
      typeSlug: meta.typeSlug,
      rawText,
      provider: "cloudflare-workers-ai",
      model,
      status: rawText ? "succeeded" : "failed",
    }),
  })
  if (!persistRes.ok) {
    const t = await persistRes.text()
    throw new Error(`persist failed: ${persistRes.status} ${t}`)
  }
}
