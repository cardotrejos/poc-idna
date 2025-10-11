import { Hono } from "hono";
import { createContext } from "@idna/api/context";
import { storage, buildAssessmentKey } from "../../lib/storage";
import { db } from "@idna/db";
import { assessmentTypes, assessmentUploads } from "@idna/db/schema/assessments";
import { eq } from "@idna/db";
import { assertCoachAssignedOrAdmin } from "@idna/api/guards";
import { processUpload } from "../../jobs/ai_ingest";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export function registerAssessmentUpload(app: Hono) {
  app.post("/uploads/assessments", async (c) => {
    const ctx = await createContext({ context: c });
    const me = ctx.session?.user?.id;
    if (!me) return c.json({ error: "UNAUTHORIZED" }, 401);

    const form = await c.req.formData();
    const file = form.get("file");
    const typeSlug = String(form.get("typeSlug") || "").trim();
    const studentUserId = String(form.get("studentUserId") || me);

    if (!(file instanceof File)) {
      return c.json({ error: "Missing file" }, 400);
    }
    if (!typeSlug) {
      return c.json({ error: "Missing typeSlug" }, 400);
    }
    if (studentUserId !== me) {
      // Only allow if coach assigned or admin
      await assertCoachAssignedOrAdmin(ctx as any, studentUserId);
    }

    if (file.size > MAX_BYTES) {
      return c.json({ error: "File too large (max 10MB)" }, 413);
    }

    const [typeRow] = await db
      .select({ id: assessmentTypes.id, slug: assessmentTypes.slug })
      .from(assessmentTypes)
      .where(eq(assessmentTypes.slug, typeSlug))
      .limit(1);

    if (!typeRow) {
      return c.json({ error: "Unknown assessment type" }, 400);
    }

    const key = buildAssessmentKey({
      studentUserId,
      typeSlug: typeRow.slug,
      filename: (file as File).name || "upload.bin",
    });

    const arrayBuf = await (file as File).arrayBuffer();
    await storage.put({ key, body: arrayBuf, contentType: (file as File).type || "application/octet-stream" });

    const inserted = await db
      .insert(assessmentUploads)
      .values({
        studentUserId,
        typeId: typeRow.id,
        storageKey: key,
        mime: (file as File).type || "application/octet-stream",
        sizeBytes: Number((file as File).size || 0),
      })
      .returning({ id: assessmentUploads.id });

    // Fire-and-forget AI ingestion (non-blocking)
    const newId = inserted[0]?.id;
    if (newId) {
      void processUpload(newId).catch((e) => {
        console.error("AI ingest failed", e);
      });
    }

    if (!newId) return c.json({ error: "Upload record not created" }, 500);
    return c.json({ uploadId: newId, status: "uploaded" as const });
  });
}
