import { protectedProcedure } from "../index";
import { db, eq } from "@idna/db";
import { documents } from "@idna/db/schema/documents";
import { z } from "zod";
import { canAccessStudent } from "../guards";

export const documentsRouter = {
  listMy: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id!;
    const rows = await db
      .select({
        id: documents.id,
        category: documents.category,
        filename: documents.filename,
        mime: documents.mime,
        sizeBytes: documents.sizeBytes,
        uploadedAt: documents.uploadedAt,
      })
      .from(documents)
      .where(eq(documents.studentUserId as any, userId) as any);
    return rows;
  }),

  listForStudent: protectedProcedure
    .input(z.object({ studentUserId: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const allowed = await canAccessStudent(context as any, input.studentUserId);
      if (!allowed) {
        throw new (await import("@orpc/server")).ORPCError("FORBIDDEN");
      }
      const rows = await db
        .select({
          id: documents.id,
          category: documents.category,
          filename: documents.filename,
          mime: documents.mime,
          sizeBytes: documents.sizeBytes,
          uploadedAt: documents.uploadedAt,
        })
        .from(documents)
        .where(eq(documents.studentUserId as any, input.studentUserId) as any);
      return rows;
    }),
};

