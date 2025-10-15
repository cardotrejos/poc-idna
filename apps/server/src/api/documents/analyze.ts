import { Hono } from "hono";
import { createContext } from "@idna/api/context";
import { db, eq } from "@idna/db";
import { documents } from "@idna/db/schema/documents";
import { canAccessStudent } from "@idna/api/guards";
import { storage } from "../../lib/storage";
import { analyzeDocument, GenericDocSchema } from "../../ai/documents/analyze";

export function registerDocumentAnalyze(app: Hono) {
  // On-demand analysis, no DB writes yet. Returns structured JSON.
  app.post("/uploads/documents/:id/analyze", async (c) => {
    const idParam = c.req.param("id");
    const id = Number(idParam);
    if (!Number.isFinite(id) || id <= 0) {
      return c.json({ error: "Invalid id" }, 400);
    }

    const ctx = await createContext({ context: c });
    const [row] = await db
      .select({
        id: documents.id,
        studentUserId: documents.studentUserId,
        storageKey: documents.storageKey,
        mime: documents.mime,
        filename: documents.filename,
      })
      .from(documents)
      .where(eq(documents.id as any, id) as any)
      .limit(1);

    if (!row) return c.json({ error: "Not found" }, 404);

    const allowed = await canAccessStudent(ctx as any, row.studentUserId);
    if (!allowed) return c.json({ error: "FORBIDDEN" }, 403);

    const taskParam = (c.req.query("task") || "auto") as "auto" | "summary" | "kv" | "full";
    const bytes = await storage.getBytes(row.storageKey);

    const result = await analyzeDocument({
      bytes,
      mimeType: row.mime || "application/octet-stream",
      task: taskParam,
      schema: GenericDocSchema,
    });

    return c.json({
      id: row.id,
      filename: row.filename,
      mime: row.mime,
      provider: result.provider,
      model: result.model,
      confidencePct: result.confidencePct,
      usage: result.usage,
      object: result.object,
    });
  });
}

