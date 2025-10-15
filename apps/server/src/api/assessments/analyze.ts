import { Hono } from "hono";
import { createContext } from "@idna/api/context";
import { db, eq } from "@idna/db";
import { assessmentUploads } from "@idna/db/schema/assessments";
import { canAccessStudent } from "@idna/api/guards";
import { processUpload } from "../../jobs/ai_ingest";

export function registerAssessmentAnalyze(app: Hono) {
  // On-demand re-analysis of an assessment upload.
  // Requires the same permissions as preview (student or assigned coach/admin).
  app.post("/uploads/assessments/:id/analyze", async (c) => {
    const ctx = await createContext({ context: c });
    const me = ctx.session?.user?.id;
    if (!me) return c.json({ error: "UNAUTHORIZED" }, 401);

    const idParam = c.req.param("id");
    const uploadId = Number(idParam);
    if (!Number.isFinite(uploadId) || uploadId <= 0) {
      return c.json({ error: "Invalid id" }, 400);
    }

    const [row] = await db
      .select({ id: assessmentUploads.id, studentUserId: assessmentUploads.studentUserId })
      .from(assessmentUploads)
      .where(eq(assessmentUploads.id, uploadId))
      .limit(1);
    if (!row) return c.json({ error: "Not found" }, 404);

    const allowed = await canAccessStudent(ctx as any, row.studentUserId);
    if (!allowed) return c.json({ error: "FORBIDDEN" }, 403);

    const out = await processUpload(uploadId);
    if (!out) return c.json({ error: "PROCESS_FAILED" }, 500);

    return c.json({
      uploadId,
      resultId: out.resultId,
      provider: out.provider,
      model: out.model,
      confidencePct: out.confidencePct,
      threshold: out.threshold,
      attempts: out.attempts,
    });
  });
}

