import { Hono } from "hono"
import { processUpload } from "../../jobs/ai_ingest"
import { db, eq } from "@idna/db"
import { assessmentUploads, assessmentResults, assessmentTypes } from "@idna/db/schema/assessments"
import { aiCalls } from "@idna/db/schema/ai"
import { getSchemaFor } from "../../ai/schemas"

export function registerInternalIngest(app: Hono) {
  app.post("/internal/ingest/:id", async (c) => {
    const header = c.req.header("x-internal-secret") || ""
    const expected = process.env.INTERNAL_API_SECRET || ""
    if (!expected || header !== expected) {
      return c.json({ error: "FORBIDDEN" }, 403)
    }

    const idStr = c.req.param("id")
    const id = Number(idStr)
    if (!Number.isFinite(id) || id <= 0) {
      return c.json({ error: "Invalid id" }, 400)
    }

    try {
      const resultId = await processUpload(id)
      return c.json({ ok: true, resultId })
    } catch (err) {
      console.error("processUpload failed", err)
      return c.json({ error: "INGEST_FAILED" }, 500)
    }
  })

  // Stage 2: Worker fetches metadata to run inference at the edge
  app.get("/internal/ingest/meta/:id", async (c) => {
    const header = c.req.header("x-internal-secret") || ""
    const expected = process.env.INTERNAL_API_SECRET || ""
    if (!expected || header !== expected) {
      return c.json({ error: "FORBIDDEN" }, 403)
    }
    const id = Number(c.req.param("id"))
    if (!Number.isFinite(id) || id <= 0) return c.json({ error: "Invalid id" }, 400)

    const [upload] = await db
      .select()
      .from(assessmentUploads)
      .where(eq(assessmentUploads.id, id))
      .limit(1)
    if (!upload) return c.json({ error: "NOT_FOUND" }, 404)

    const [type] = await db
      .select({ id: assessmentTypes.id, slug: assessmentTypes.slug })
      .from(assessmentTypes)
      .where(eq(assessmentTypes.id, upload.typeId))
      .limit(1)
    if (!type) return c.json({ error: "TYPE_NOT_FOUND" }, 404)

    return c.json({
      uploadId: upload.id,
      storageKey: upload.storageKey,
      mime: upload.mime,
      typeId: type.id,
      typeSlug: type.slug,
    })
  })

  // Stage 2: Worker posts raw result; server validates + persists
  app.post("/internal/ingest/complete", async (c) => {
    const header = c.req.header("x-internal-secret") || ""
    const expected = process.env.INTERNAL_API_SECRET || ""
    if (!expected || header !== expected) {
      return c.json({ error: "FORBIDDEN" }, 403)
    }
    type Body = {
      uploadId: number
      typeId: number
      typeSlug: string
      rawText?: string
      resultsJson?: any
      confidencePct?: number
      usage?: { tokensIn?: number; tokensOut?: number }
      provider: string
      model: string
      status?: "succeeded" | "failed"
    }
    const body = (await c.req.json()) as Body
    const { uploadId, typeId, typeSlug } = body
    if (!uploadId || !typeId || !typeSlug) return c.json({ error: "INVALID" }, 400)

    // Parse JSON from rawText if provided
    let parsed: any = body.resultsJson ?? {}
    if (!parsed && body.rawText) {
      const raw = String(body.rawText)
      const s = raw.indexOf("{")
      const e = raw.lastIndexOf("}")
      if (s >= 0 && e > s) {
        try {
          parsed = JSON.parse(raw.slice(s, e + 1))
        } catch {}
      }
    }

    // Validate against known schema
    try {
      const schema = getSchemaFor(typeSlug)
      parsed = schema.parse(parsed)
    } catch {
      // leave parsed as-is; staff review later
    }

    const confidencePct =
      body.confidencePct ?? (parsed && Object.keys(parsed).length > 0 ? 70 : 0)
    const status = body.status ?? (confidencePct > 0 ? "succeeded" : "failed")

    // Persist results and usage
    const inserted = await db
      .insert(assessmentResults)
      .values({ uploadId, typeId, resultsJson: parsed, confidencePct })
      .returning({ id: assessmentResults.id })

    await db
      .update(assessmentUploads)
      .set({ status: "needs_review" })
      .where(eq(assessmentUploads.id, uploadId))

    await db.insert(aiCalls).values({
      uploadId,
      provider: body.provider,
      model: body.model,
      tokensIn: body.usage?.tokensIn || 0,
      tokensOut: body.usage?.tokensOut || 0,
      costMinorUnits: 0,
      status: status as any,
    })

    return c.json({ ok: true, resultId: inserted[0]?.id })
  })
}
