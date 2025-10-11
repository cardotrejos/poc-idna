import { Hono } from "hono";
import { createContext } from "@idna/api/context";
import { db } from "@idna/db";
import { assessmentUploads } from "@idna/db/schema/assessments";
import { eq } from "@idna/db";
import { canAccessStudent } from "@idna/api/guards";
import { storage } from "../../lib/storage";

export function registerAssessmentPreview(app: Hono) {
  app.get("/uploads/assessments/:uploadId/url", async (c) => {
    const ctx = await createContext({ context: c });
    const me = ctx.session?.user?.id;
    if (!me) return c.json({ error: "UNAUTHORIZED" }, 401);

    const idParam = c.req.param("uploadId");
    const uploadId = Number(idParam);
    if (!Number.isInteger(uploadId)) return c.json({ error: "Invalid id" }, 400);

    const [row] = await db
      .select({
        id: assessmentUploads.id,
        studentUserId: assessmentUploads.studentUserId,
        storageKey: assessmentUploads.storageKey,
        mime: assessmentUploads.mime,
      })
      .from(assessmentUploads)
      .where(eq(assessmentUploads.id, uploadId))
      .limit(1);

    if (!row) return c.json({ error: "Not found" }, 404);

    const allowed = await canAccessStudent(ctx as any, row.studentUserId);
    if (!allowed) return c.json({ error: "FORBIDDEN" }, 403);

    const url = await storage.getSignedUrl(row.storageKey, 300);
    return c.json({ url, expiresIn: 300, mime: row.mime });
  });
}
