import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "./schema";

/**
 * Create and configure Better Auth instance
 *
 * @example
 * ```typescript
 * import { auth } from "auth/server";
 * import { db } from "db/client";
 *
 * const authInstance = createAuth(db);
 * ```
 */
export function createAuth(db: any) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    socialProviders: {
      // Add your social providers here
      // Example:
      // github: {
      //   clientId: process.env.GITHUB_CLIENT_ID!,
      //   clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      // },
    },
    secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-change-in-production",
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  });
}

/**
 * Type helper for Better Auth instance
 */
export type Auth = ReturnType<typeof createAuth>;

/**
 * Export schema for migrations and external use
 */
export { schema };
