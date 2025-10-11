import { protectedProcedure } from "../index";
import { db, eq } from "@idna/db";
import { assessmentUploads, assessmentResults, assessmentTypes } from "@idna/db/schema/assessments";

export const studentAssessmentsRouter = {
  listApproved: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id!;
    const rows = await db
      .select({
        uploadId: assessmentUploads.id,
        typeSlug: assessmentTypes.slug,
        typeName: assessmentTypes.name,
        results: assessmentResults.resultsJson,
        confidencePct: assessmentResults.confidencePct,
        reviewedAt: assessmentResults.reviewedAt,
        submittedAt: assessmentUploads.submittedAt,
      })
      .from(assessmentUploads)
      .innerJoin(assessmentTypes, eq(assessmentTypes.id as any, assessmentUploads.typeId) as any)
      .leftJoin(assessmentResults, eq(assessmentResults.uploadId as any, assessmentUploads.id) as any)
      .where(eq(assessmentUploads.studentUserId as any, userId) as any)
      .where(eq(assessmentUploads.status as any, "approved") as any);

    return rows;
  }),

  listMyUploads: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id!;
    const rows = await db
      .select({
        id: assessmentUploads.id,
        status: assessmentUploads.status,
        submittedAt: assessmentUploads.submittedAt,
        typeSlug: assessmentTypes.slug,
      })
      .from(assessmentUploads)
      .innerJoin(assessmentTypes, eq(assessmentTypes.id as any, assessmentUploads.typeId) as any)
      .where(eq(assessmentUploads.studentUserId as any, userId) as any);
    return rows;
  }),
};
