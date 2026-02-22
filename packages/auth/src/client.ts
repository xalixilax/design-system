import { createAuthClient } from "better-auth/react";
import type { Auth } from "./server";

/**
 * Better Auth Client for React
 * Use this in your React components to interact with Better Auth
 *
 * @example
 * ```typescript
 * import { authClient } from "auth/client";
 *
 * function LoginButton() {
 *   const { signIn } = authClient.useSession();
 *
 *   return (
 *     <button onClick={() => signIn.email({ email: "user@example.com", password: "password" })}>
 *       Sign In
 *     </button>
 *   );
 * }
 * ```
 */
export const authClient = createAuthClient({
  baseURL: process.env.VITE_BETTER_AUTH_URL || "http://localhost:3000",
});

/**
 * Type-safe auth client
 */
export type AuthClient = typeof authClient;

/**
 * Export hooks for convenience
 */
export const { useSession, signIn, signOut, signUp } = authClient;
