import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@idna/db";
import * as schema from "@idna/db/schema/auth";

const isProd = process.env.NODE_ENV === "production";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",

		schema: schema,
	}),
	trustedOrigins: [process.env.CORS_ORIGIN || ""],
	emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`,
      scope: ["openid", "email", "profile"],
      enabled: true,
    },
  },
	advanced: {
		// Use secure + SameSite=None in production. In local dev over http,
		// set secure=false and SameSite=lax so cookies stick between 3000↔3001.
		defaultCookieAttributes: {
			sameSite: isProd ? "none" : "lax",
			secure: isProd,
			httpOnly: true,
		},
	},
});
