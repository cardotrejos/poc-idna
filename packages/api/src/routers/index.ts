import { protectedProcedure, publicProcedure } from "../index";
import type { RouterClient } from "@orpc/server";
import { adminAssessmentsRouter } from "./adminAssessments";
import { studentAssessmentsRouter } from "./studentAssessments";
import { assessmentsRouter } from "./assessments";
import { documentsRouter } from "./documents";
import { adminStudentsRouter } from "./adminStudents";
import { coachStudentsRouter } from "./coachStudents";
import { progressRouter } from "./progress";
import { storiesRouter } from "./stories";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),
	adminAssessments: adminAssessmentsRouter,
  studentAssessments: studentAssessmentsRouter,
  assessments: assessmentsRouter,
  documents: documentsRouter,
  adminStudents: adminStudentsRouter,
  coachStudents: coachStudentsRouter,
  progress: progressRouter,
  stories: storiesRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
