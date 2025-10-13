import { protectedProcedure } from "../index";
import { db, eq, sql, and } from "@idna/db";
import { user as userTable } from "@idna/db/schema/auth";
import { assessmentUploads, assessmentTypes } from "@idna/db/schema/assessments";
import { documents } from "@idna/db/schema/documents";
import { stories } from "@idna/db/schema/stories";

type StepStatus = "done" | "current" | "todo";

export const progressRouter = {
  getMy: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id!;

    // Profile completeness heuristic: has a non-empty name and verified email
    const [u] = await db
      .select({ name: userTable.name, emailVerified: userTable.emailVerified })
      .from(userTable)
      .where(eq(userTable.id as any, userId) as any)
      .limit(1);
    const completedProfile = Boolean(u?.name) && Boolean(u?.emailVerified);

    // Counts for assessments
    const totalUploadsRow = await db
      .select({ totalUploads: sql<number>`count(*)` })
      .from(assessmentUploads)
      .where(eq(assessmentUploads.studentUserId as any, userId) as any);
    const totalUploads = Number(totalUploadsRow[0]?.totalUploads ?? 0);

    const approvedUploadsRow = await db
      .select({ approvedUploads: sql<number>`count(*)` })
      .from(assessmentUploads)
      .where(
        and(
          eq(assessmentUploads.studentUserId as any, userId) as any,
          eq(assessmentUploads.status as any, "approved") as any,
        ) as any,
      );
    const approvedUploads = Number(approvedUploadsRow[0]?.approvedUploads ?? 0);

    // Required assessment types
    const requiredTypesRow = await db
      .select({ requiredTypes: sql<number>`count(*)` })
      .from(assessmentTypes)
      .where(eq(assessmentTypes.required as any, 1) as any);
    const requiredTypes = Number(requiredTypesRow[0]?.requiredTypes ?? 0);

    // Count of distinct required types with at least one approved upload for this user
    const requiredApprovedRow = await db
      .select({ requiredApproved: sql<number>`count(distinct ${assessmentUploads.typeId})` })
      .from(assessmentUploads)
      .innerJoin(assessmentTypes, eq(assessmentTypes.id as any, assessmentUploads.typeId) as any)
      .where(
        and(
          eq(assessmentUploads.studentUserId as any, userId) as any,
          eq(assessmentUploads.status as any, "approved") as any,
          eq(assessmentTypes.required as any, 1) as any,
        ) as any,
      );
    const requiredApproved = Number(requiredApprovedRow[0]?.requiredApproved ?? 0);

    // Documents uploaded
    const docsRow = await db
      .select({ docs: sql<number>`count(*)` })
      .from(documents)
      .where(eq(documents.studentUserId as any, userId) as any);
    const docs = Number(docsRow[0]?.docs ?? 0);

    // Stories count
    const storiesRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(stories)
      .where(eq(stories.studentUserId as any, userId) as any);
    const storiesCount = Number(storiesRow[0]?.count ?? 0);

    // Step completion logic
    const profileDone = completedProfile;
    const assessmentsDone = requiredTypes > 0 ? requiredApproved >= requiredTypes : approvedUploads > 0;
    const documentsDone = docs > 0;
    const storiesDone = storiesCount > 0;
    // iDNA considered "done" when the first four steps are done (acts as a culmination step)
    const idnaDone = profileDone && assessmentsDone && documentsDone && storiesDone;

    // Determine a single "current" step (first not-done in order)
    const order: Array<[keyof ProgressResponse["steps"], boolean]> = [
      ["profile", profileDone],
      ["assessments", assessmentsDone],
      ["documents", documentsDone],
      ["stories", storiesDone],
      ["idna", idnaDone],
    ];
    const firstTodoIndex = order.findIndex(([_, done]) => !done);
    const steps = order.reduce<ProgressResponse["steps"]>((acc, [key, done], idx) => {
      let status: StepStatus = done ? "done" : "todo";
      if (!done && idx === firstTodoIndex) status = "current";
      acc[key] = status;
      return acc;
    }, { profile: "todo", assessments: "todo", documents: "todo", stories: "todo", idna: "todo" });

    // Percent complete = 5 equal steps
    const rawPct = ((profileDone ? 1 : 0) + (assessmentsDone ? 1 : 0) + (documentsDone ? 1 : 0) + (storiesDone ? 1 : 0) + (idnaDone ? 1 : 0)) / 5;
    const percentComplete = Math.round(rawPct * 100);

    const res: ProgressResponse = {
      completedProfile,
      uploadedAssessments: totalUploads,
      approvedAssessments: approvedUploads,
      requiredTypes,
      requiredApproved,
      uploadedDocuments: docs,
      storiesCount,
      percentComplete,
      steps,
    };
    return res;
  }),
};

export type ProgressResponse = {
  completedProfile: boolean;
  uploadedAssessments: number;
  approvedAssessments: number;
  requiredTypes: number;
  requiredApproved: number;
  uploadedDocuments: number;
  storiesCount: number;
  percentComplete: number; // 0..100
  steps: {
    profile: StepStatus;
    assessments: StepStatus;
    documents: StepStatus;
    stories: StepStatus;
    idna: StepStatus;
  };
};
