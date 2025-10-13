import { Hono } from "hono";
import { createContext } from "@idna/api/context";
import { db, eq } from "@idna/db";
import { documents } from "@idna/db/schema/documents";
import { storage } from "../../lib/storage";
import { canAccessStudent } from "@idna/api/guards";

export function registerDocumentDelete(app: Hono) {
  app.delete("/uploads/documents/:id", async (c) => {
    const id = Number(c.req.param("id"));
    if (!Number.isFinite(id) || id <= 0) return c.json({ error: "Invalid id" }, 400);
    const ctx = await createContext({ context: c });

    const [row] = await db
      .select({ id: documents.id, studentUserId: documents.studentUserId, storageKey: documents.storageKey })
      .from(documents)
      .where(eq(documents.id as any, id) as any)
      .limit(1);
    if (!row) return c.json({ error: "Not found" }, 404);

    const allowed = await canAccessStudent(ctx as any, row.studentUserId);
    if (!allowed) return c.json({ error: "FORBIDDEN" }, 403);

    // delete storage then DB row
    await storage.delete(row.storageKey);
    await db.delete(documents).where(eq(documents.id as any, id) as any);
    return c.json({ ok: true });
  });
}

