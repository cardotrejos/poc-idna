import { ORPCError } from "@orpc/server";
import { db } from "@idna/db";
import { coachAssignments } from "@idna/db/schema/students";
import { eq, and } from "@idna/db";
import type { Context } from "./context";

export type UserRole = "student" | "coach" | "admin";

export function assertAuthenticated(ctx: Context) {
  if (!ctx.session?.user?.id) {
    throw new ORPCError("UNAUTHORIZED");
  }
}

export function assertRole(ctx: Context, ...roles: UserRole[]) {
  assertAuthenticated(ctx);
  const role = (ctx.session!.user as any).role as UserRole | undefined;
  if (!role || !roles.includes(role)) {
    throw new ORPCError("FORBIDDEN");
  }
}

export async function assertSelfOrAdmin(ctx: Context, studentUserId: string) {
  assertAuthenticated(ctx);
  const me = ctx.session!.user!.id;
  const role = (ctx.session!.user as any).role as UserRole | undefined;
  if (me === studentUserId) return;
  if (role === "admin") return;
  throw new ORPCError("FORBIDDEN");
}

export async function assertCoachAssignedOrAdmin(
  ctx: Context,
  studentUserId: string,
) {
  assertAuthenticated(ctx);
  const me = ctx.session!.user!.id;
  const role = (ctx.session!.user as any).role as UserRole | undefined;
  if (role === "admin") return; // admins always allowed
  if (role !== "coach") throw new ORPCError("FORBIDDEN");

  const [assignment] = await db
    .select({ id: coachAssignments.id })
    .from(coachAssignments)
    .where(
      and(
        eq(coachAssignments.coachUserId, me),
        eq(coachAssignments.studentUserId, studentUserId),
      ),
    )
    .limit(1);

  if (!assignment) throw new ORPCError("FORBIDDEN");
}

export async function canAccessStudent(
  ctx: Context,
  studentUserId: string,
): Promise<boolean> {
  try {
    assertAuthenticated(ctx);
    const me = ctx.session!.user!.id;
    const role = (ctx.session!.user as any).role as UserRole | undefined;
    if (role === "admin") return true;
    if (me === studentUserId) return true;
    if (role !== "coach") return false;
    const [assignment] = await db
      .select({ id: coachAssignments.id })
      .from(coachAssignments)
      .where(
        and(
          eq(coachAssignments.coachUserId, me),
          eq(coachAssignments.studentUserId, studentUserId),
        ),
      )
      .limit(1);
    return Boolean(assignment);
  } catch {
    return false;
  }
}
