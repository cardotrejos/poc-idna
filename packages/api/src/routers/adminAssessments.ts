import { protectedProcedure } from "../index";
import z from "zod";
import { db, eq, and, inArray, sql } from "@idna/db";
import { assessmentUploads, assessmentTypes, assessmentResults } from "@idna/db/schema/assessments";
import { aiCalls } from "@idna/db/schema/ai";
import { user as userTable } from "@idna/db/schema/auth";

const statusEnum = z.enum(["uploaded", "processing", "needs_review", "approved", "rejected"]);

export const adminAssessmentsRouter = {
  listUploads: protectedProcedure
    .input(
      z.object({
        status: statusEnum.optional(),
        q: z.string().optional(),
        page: z.number().int().min(1).default(1).optional(),
        pageSize: z.number().int().min(1).max(100).default(20).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const role = (context.session?.user as any)?.role;
      if (role !== "admin") {
        throw new Error("FORBIDDEN");
      }
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;

      // Base query
      const base = db
        .select({
          id: assessmentUploads.id,
          status: assessmentUploads.status,
          submittedAt: assessmentUploads.submittedAt,
          studentUserId: assessmentUploads.studentUserId,
          typeSlug: assessmentTypes.slug,
          typeName: assessmentTypes.name,
          studentName: userTable.name,
          studentEmail: userTable.email,
        })
        .from(assessmentUploads)
        .leftJoin(assessmentTypes, eq(assessmentTypes.id as any, assessmentUploads.typeId) as any)
        .leftJoin(userTable, eq(userTable.id as any, assessmentUploads.studentUserId) as any);

      const conditions: any[] = [];
      if (input?.status) conditions.push(eq(assessmentUploads.status as any, input.status) as any);
      if (input?.q && input.q.trim()) {
        const like = "%" + input.q.trim() + "%";
        conditions.push(sql`${userTable.name} ILIKE ${like} OR ${userTable.email} ILIKE ${like}` as any);
      }

      const filtered = conditions.length === 0
        ? base
        : conditions.length === 1
        ? base.where(conditions[0]!)
        : base.where(and(...conditions) as any);

      const rows = await filtered
        .orderBy(assessmentUploads.submittedAt)
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const uploadIds = rows.map((r) => r.id);
      let confidences: Record<number, number> = {};
      let lastCall: Record<number, { provider: string; model: string; createdAt: Date } | undefined> = {};
      if (uploadIds.length) {
        const resRows = await db
          .select({ id: assessmentResults.id, uploadId: assessmentResults.uploadId, confidencePct: assessmentResults.confidencePct })
          .from(assessmentResults)
          .where(inArray(assessmentResults.uploadId as any, uploadIds) as any);
        for (const r of resRows) confidences[r.uploadId] = r.confidencePct ?? 0;

        const callRows = await db
          .select({ uploadId: aiCalls.uploadId, provider: aiCalls.provider, model: aiCalls.model, createdAt: aiCalls.createdAt })
          .from(aiCalls)
          .where(inArray(aiCalls.uploadId as any, uploadIds) as any)
          .orderBy(sql`${aiCalls.createdAt} desc` as any);
        for (const c of callRows) {
          if (!lastCall[c.uploadId]) lastCall[c.uploadId] = { provider: c.provider, model: c.model, createdAt: c.createdAt as any };
        }
      }

      return {
        items: rows.map((r) => ({
          ...r,
          confidencePct: confidences[r.id] ?? 0,
          lastCall: lastCall[r.id] || null,
        })),
        page,
        pageSize,
      };
    }),

  getUpload: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .handler(async ({ input, context }) => {
      const role = (context.session?.user as any)?.role;
      if (role !== "admin") throw new Error("FORBIDDEN");

      const [upload] = await db
        .select({
          id: assessmentUploads.id,
          status: assessmentUploads.status,
          submittedAt: assessmentUploads.submittedAt,
          studentUserId: assessmentUploads.studentUserId,
          storageKey: assessmentUploads.storageKey,
          mime: assessmentUploads.mime,
          typeId: assessmentUploads.typeId,
          typeSlug: assessmentTypes.slug,
          typeName: assessmentTypes.name,
          studentName: userTable.name,
          studentEmail: userTable.email,
        })
        .from(assessmentUploads)
        .leftJoin(assessmentTypes, eq(assessmentTypes.id as any, assessmentUploads.typeId) as any)
        .leftJoin(userTable, eq(userTable.id as any, assessmentUploads.studentUserId) as any)
        .where(eq(assessmentUploads.id as any, input.id) as any)
        .limit(1);
      if (!upload) throw new Error("NOT_FOUND");

      const [result] = await db
        .select({
          id: assessmentResults.id,
          resultsJson: assessmentResults.resultsJson,
          confidencePct: assessmentResults.confidencePct,
          reviewedBy: assessmentResults.reviewedBy,
          reviewedAt: assessmentResults.reviewedAt,
        })
        .from(assessmentResults)
        .where(eq(assessmentResults.uploadId as any, upload.id) as any)
        .orderBy(sql`${assessmentResults.id} desc` as any)
        .limit(1);

      const [lastCall] = await db
        .select({ provider: aiCalls.provider, model: aiCalls.model, tokensIn: aiCalls.tokensIn, tokensOut: aiCalls.tokensOut, createdAt: aiCalls.createdAt })
        .from(aiCalls)
        .where(eq(aiCalls.uploadId as any, upload.id) as any)
        .orderBy(sql`${aiCalls.createdAt} desc` as any)
        .limit(1);

      return { upload, result: result ?? null, lastCall: lastCall ?? null };
    }),

  updateResult: protectedProcedure
    .input(z.object({ id: z.number().int(), resultsJson: z.any(), confidencePct: z.number().min(0).max(100).optional() }))
    .handler(async ({ input, context }) => {
      const role = (context.session?.user as any)?.role;
      const reviewerId = context.session?.user?.id;
      if (role !== "admin" || !reviewerId) throw new Error("FORBIDDEN");

      const [existing] = await db
        .select({ id: assessmentResults.id })
        .from(assessmentResults)
        .where(eq(assessmentResults.uploadId as any, input.id) as any)
        .limit(1);

      if (existing) {
        await db
          .update(assessmentResults)
          .set({
            resultsJson: input.resultsJson,
            confidencePct: input.confidencePct ?? 100,
            reviewedBy: reviewerId,
            reviewedAt: new Date(),
          })
          .where(eq(assessmentResults.id as any, existing.id) as any);
      } else {
        // create a result row if missing
        await db.insert(assessmentResults).values({
          uploadId: input.id,
          typeId: 0 as any, // not used here, but column required; kept 0 to avoid null
          resultsJson: input.resultsJson,
          confidencePct: input.confidencePct ?? 100,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        } as any);
      }

      // keep status needs_review until approve
      return { ok: true };
    }),

  setStatus: protectedProcedure
    .input(z.object({ id: z.number().int(), status: statusEnum }))
    .handler(async ({ input, context }) => {
      const role = (context.session?.user as any)?.role;
      const reviewerId = context.session?.user?.id;
      if (role !== "admin" || !reviewerId) throw new Error("FORBIDDEN");

      await db
        .update(assessmentUploads)
        .set({ status: input.status, updatedAt: new Date() as any })
        .where(eq(assessmentUploads.id as any, input.id) as any);

      if (input.status === "approved") {
        await db
          .update(assessmentResults)
          .set({ reviewedBy: reviewerId, reviewedAt: new Date() })
          .where(eq(assessmentResults.uploadId as any, input.id) as any);
      }

      return { ok: true };
    }),
};
