import { protectedProcedure } from "../index";
import { db, eq, and, sql } from "@idna/db";
import { user as users } from "@idna/db/schema/auth";
import { z } from "zod";

export const adminStudentsRouter = {
  list: protectedProcedure
    .input(z.object({ q: z.string().optional(), page: z.number().default(1), pageSize: z.number().default(25) }))
    .handler(async ({ context, input }) => {
      const role = (context.session?.user as any)?.role;
      if (role !== "admin") {
        throw new (await import("@orpc/server")).ORPCError("FORBIDDEN");
      }
      const offset = (input.page - 1) * input.pageSize;
      const rows = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(
          input.q
            ? (and(
                eq(users.role as any, "student" as any) as any,
                sql`${users.name} ILIKE ${"%" + input.q + "%"} OR ${users.email} ILIKE ${"%" + input.q + "%"}` as any,
              ) as any)
            : (eq(users.role as any, "student" as any) as any),
        )
        .limit(input.pageSize)
        .offset(offset);
      return { items: rows, page: input.page, pageSize: input.pageSize };
    }),
};
