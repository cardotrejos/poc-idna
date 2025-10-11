// Using 'any' to keep API package decoupled from Hono types
type HonoContext = any;
import { auth } from "@idna/auth";
import { db } from "@idna/db";
import { user as userTable } from "@idna/db/schema/auth";
import { eq } from "@idna/db";

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});

	let sessionWithRole = session;
	try {
		const userId = session?.user?.id;
		if (userId) {
    		const rows = await db
    			.select({ role: userTable.role })
    			.from(userTable)
    			.where(eq(userTable.id as any, userId) as any)
    			.limit(1);
			const role = rows[0]?.role ?? "student";
			sessionWithRole = {
				...session,
				user: { ...session!.user, role },
			} as typeof session;
		}
	} catch {}

	return {
		session: sessionWithRole,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
