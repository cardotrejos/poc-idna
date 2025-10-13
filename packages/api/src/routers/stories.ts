import { protectedProcedure } from "../index";
import { db, eq, sql, and } from "@idna/db";
import { stories } from "@idna/db/schema/stories";
import { z } from "zod";

const PageInput = z.object({ page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(100).default(20) });

export const storiesRouter = {
  list: protectedProcedure
    .input(PageInput.optional())
    .handler(async ({ context, input }) => {
      const userId = context.session?.user?.id!;
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;
      const offset = (page - 1) * pageSize;

      const items = await db
        .select({
          id: stories.id,
          promptKey: stories.promptKey,
          contentRichtext: stories.contentRichtext,
          isDraft: stories.isDraft,
          wordCount: stories.wordCount,
          createdAt: stories.createdAt,
          updatedAt: stories.updatedAt,
        })
        .from(stories)
        .where(eq(stories.studentUserId as any, userId) as any)
        .orderBy(sql`"created_at" desc` as any)
        .limit(pageSize)
        .offset(offset);

      return { items, page, pageSize };
    }),

  create: protectedProcedure
    .input(
      z.object({
        promptKey: z.string().min(1),
        contentRichtext: z.string().min(1),
        isDraft: z.boolean().optional().default(true),
      }),
    )
    .handler(async ({ context, input }) => {
      const userId = context.session?.user?.id!;
      const wordCount = input.contentRichtext.trim().split(/\s+/).filter(Boolean).length;
      const [row] = await db
        .insert(stories)
        .values({
          studentUserId: userId,
          promptKey: input.promptKey,
          contentRichtext: input.contentRichtext,
          isDraft: input.isDraft ?? true,
          wordCount,
        } as any)
        .returning({ id: stories.id });
      if (!row) {
        throw new (await import("@orpc/server")).ORPCError("INTERNAL_SERVER_ERROR");
      }
      return { id: row.id };
    }),

  update: protectedProcedure
    .input(
      z.object({ id: z.number().int().positive(), contentRichtext: z.string().min(1), isDraft: z.boolean().optional() }),
    )
    .handler(async ({ context, input }) => {
      const userId = context.session?.user?.id!;
      const wordCount = input.contentRichtext.trim().split(/\s+/).filter(Boolean).length;
      const res = await db
        .update(stories)
        .set({ contentRichtext: input.contentRichtext, isDraft: input.isDraft ?? true, wordCount } as any)
        .where(and(eq(stories.id as any, input.id) as any, eq(stories.studentUserId as any, userId) as any) as any)
        .returning({ id: stories.id });
      if (res.length === 0) {
        throw new (await import("@orpc/server")).ORPCError("NOT_FOUND");
      }
      return { ok: true } as const;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .handler(async ({ context, input }) => {
      const userId = context.session?.user?.id!;
      const res = await db
        .delete(stories)
        .where(and(eq(stories.id as any, input.id) as any, eq(stories.studentUserId as any, userId) as any) as any)
        .returning({ id: stories.id });
      if (res.length === 0) {
        throw new (await import("@orpc/server")).ORPCError("NOT_FOUND");
      }
      return { ok: true } as const;
    }),
};
