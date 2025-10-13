import { protectedProcedure } from "../index";
import { db, eq } from "@idna/db";
import { coachAssignments, studentProfile } from "@idna/db/schema/students";
import { user as users } from "@idna/db/schema/auth";

export const coachStudentsRouter = {
  listAssigned: protectedProcedure.handler(async ({ context }) => {
    const me = context.session?.user?.id!;
    const role = (context.session?.user as any)?.role;
    if (role !== "coach" && role !== "admin") {
      throw new (await import("@orpc/server")).ORPCError("FORBIDDEN");
    }
    const rows = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(coachAssignments)
      .innerJoin(studentProfile, eq(studentProfile.userId as any, coachAssignments.studentUserId) as any)
      .innerJoin(users, eq(users.id as any, studentProfile.userId) as any)
      .where(eq(coachAssignments.coachUserId as any, me) as any);
    return rows;
  }),
};

