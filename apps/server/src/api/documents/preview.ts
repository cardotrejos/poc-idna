import { Hono } from "hono";
import { createContext } from "@idna/api/context";
import { db, eq } from "@idna/db";
import { documents } from "@idna/db/schema/documents";
import { canAccessStudent } from "@idna/api/guards";
import { storage } from "../../lib/storage";

export function registerDocumentPreview(app: Hono) {
  app.get("/uploads/documents/:id/url", async (c) => {
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
      })
      .from(documents)
      .where(eq(documents.id as any, id) as any)
      .limit(1);

    if (!row) return c.json({ error: "Not found" }, 404);

    const allowed = await canAccessStudent(ctx as any, row.studentUserId);
    if (!allowed) return c.json({ error: "FORBIDDEN" }, 403);

    const url = await storage.getSignedUrl(row.storageKey);
    return c.json({ url });
  });
}

