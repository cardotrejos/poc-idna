import "dotenv/config";
import { db, eq } from "@idna/db";
import { user as users } from "@idna/db/schema/auth";
import { auth } from "@idna/auth";

async function ensureUser(opts: { email: string; password: string; name: string; role: "admin" | "coach" }) {
  // Create (idempotent-ish): if exists, signUpEmail will throw; we'll catch and continue
  try {
    await auth.api.signUpEmail({
      body: { email: opts.email, password: opts.password, name: opts.name },
    });
    console.log(`Created user ${opts.email}`);
  } catch (e: any) {
    // If already exists, continue
    const msg = e?.message || String(e);
    if (!/already exists|unique/i.test(msg)) {
      console.warn(`Sign up for ${opts.email} returned: ${msg}`);
    } else {
      console.log(`User ${opts.email} already exists, continuing`);
    }
  }

  // Promote role
  await db.update(users).set({ role: opts.role as any }).where(eq(users.email as any, opts.email) as any);
  console.log(`Set role=${opts.role} for ${opts.email}`);
}

async function main() {
  const adminEmail = "cardotrejos+1@gmail.com";
  const coachEmail = "cardotrejos+2@gmail.com";
  const password = "fluCKE619*";

  await ensureUser({ email: adminEmail, password, name: "Admin", role: "admin" });
  await ensureUser({ email: coachEmail, password, name: "Coach", role: "coach" });
}

main().then(() => {
  console.log("Seed complete");
  process.exit(0);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});

