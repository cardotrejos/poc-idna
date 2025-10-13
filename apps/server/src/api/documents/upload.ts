import { Hono } from "hono";
import { createContext } from "@idna/api/context";
import { storage, buildDocumentKey } from "../../lib/storage";
import { db } from "@idna/db";
import { documents } from "@idna/db/schema/documents";
import { assertCoachAssignedOrAdmin } from "@idna/api/guards";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export function registerDocumentUpload(app: Hono) {
  app.post("/uploads/documents", async (c) => {
    const ctx = await createContext({ context: c });
    const me = ctx.session?.user?.id;
    if (!me) return c.json({ error: "UNAUTHORIZED" }, 401);

    const form = await c.req.formData();
    const file = form.get("file");
    const category = String(form.get("category") || "other").trim() || "other";
    const studentUserId = String(form.get("studentUserId") || me);

    if (!(file instanceof File)) {
      return c.json({ error: "Missing file" }, 400);
    }
    if (studentUserId !== me) {
      // Only allow if coach assigned or admin
      await assertCoachAssignedOrAdmin(ctx as any, studentUserId);
    }
    if ((file as File).size > MAX_BYTES) {
      return c.json({ error: "File too large (max 10MB)" }, 413);
    }

    const key = buildDocumentKey({
      studentUserId,
      category,
      filename: (file as File).name || "upload.bin",
    });

    const arrayBuf = await (file as File).arrayBuffer();
    await storage.put({ key, body: arrayBuf, contentType: (file as File).type || "application/octet-stream" });

    const inserted = await db
      .insert(documents)
      .values({
        studentUserId,
        category: category as any,
        storageKey: key,
        filename: (file as File).name || "upload.bin",
        mime: (file as File).type || "application/octet-stream",
        sizeBytes: Number((file as File).size || 0),
      })
      .returning({ id: documents.id });

    const newId = inserted[0]?.id;
    if (!newId) return c.json({ error: "Upload record not created" }, 500);
    return c.json({ id: newId, status: "uploaded" as const });
  });
}

