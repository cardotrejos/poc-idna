import { protectedProcedure, publicProcedure } from "../index";
import type { RouterClient } from "@orpc/server";
import { todoRouter } from "./todo";
import { adminAssessmentsRouter } from "./adminAssessments";
import { studentAssessmentsRouter } from "./studentAssessments";
import { assessmentsRouter } from "./assessments";

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
	todo: todoRouter,
	adminAssessments: adminAssessmentsRouter,
	studentAssessments: studentAssessmentsRouter,
	assessments: assessmentsRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
