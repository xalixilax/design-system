# Auth Package

Better Auth integration package for the monorepo. This package provides a centralized authentication solution using [Better Auth](https://www.better-auth.com/) with Drizzle ORM and Hono.

## Installation

This package is already part of the monorepo. To install dependencies:

```bash
pnpm install
```

## Package Exports

- `auth/server` - Server-side Better Auth configuration
- `auth/client` - Client-side Better Auth hooks and utilities (React)
- `auth/schema` - Drizzle schema for auth tables
- `auth/types` - TypeScript types for auth entities

## Usage

### 1. Server Setup (Hono API)

First, integrate Better Auth with your Hono server:

```typescript
// servers/api/src/index.ts
import { Hono } from "hono";
import { createAuth } from "auth/server";
import { db } from "db/client";

const app = new Hono();

// Create auth instance
const auth = createAuth(db);

// Mount Better Auth routes
app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

export default app;
```

### 2. Database Schema

The auth package provides the necessary database schema. You need to include it in your database package:

```typescript
// packages/db/src/schema/index.ts
export * from "./users";
export * from "auth/schema";  // Add this line
```

Then run migrations:

```bash
pnpm db db:generate
pnpm db db:push
```

### 3. Client Setup (React)

In your React application, use the auth client:

```typescript
// clients/web/src/App.tsx
import { authClient } from "auth/client";

function App() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <LoginForm />;
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}!</h1>
      <button onClick={() => authClient.signOut()}>Sign Out</button>
    </div>
  );
}
```

### 4. Authentication Forms

#### Sign Up

```typescript
import { authClient } from "auth/client";

function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSignUp = async () => {
    await authClient.signUp.email({
      email,
      password,
      name,
    });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }}>
      <input 
        type="text" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="Name" 
      />
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        placeholder="Email" 
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        placeholder="Password" 
      />
      <button type="submit">Sign Up</button>
    </form>
  );
}
```

#### Sign In

```typescript
import { authClient } from "auth/client";

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async () => {
    await authClient.signIn.email({
      email,
      password,
    });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSignIn(); }}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        placeholder="Email" 
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        placeholder="Password" 
      />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

## Environment Variables

Add these environment variables to your `.env` file:

### Server (servers/api/.env)
```env
BETTER_AUTH_SECRET=your-super-secret-key-change-in-production
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/app_db
```

### Client (clients/web/.env)
```env
VITE_BETTER_AUTH_URL=http://localhost:3000
```

## Adding Social Providers

To add social authentication (GitHub, Google, etc.), update the server configuration:

```typescript
// packages/auth/src/server.ts
export function createAuth(db: any) {
  return betterAuth({
    // ... existing config
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
  });
}
```

Then add the environment variables:

```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Adding Plugins

Better Auth supports many plugins. Here are some examples:

### Two-Factor Authentication

```typescript
import { twoFactor } from "better-auth/plugins";

export function createAuth(db: any) {
  return betterAuth({
    // ... existing config
    plugins: [
      twoFactor({
        issuer: "YourAppName",
      }),
    ],
  });
}
```

### Organization/Teams

```typescript
import { organization } from "better-auth/plugins";

export function createAuth(db: any) {
  return betterAuth({
    // ... existing config
    plugins: [
      organization(),
    ],
  });
}
```

## Protected Routes

### Server-side (Hono Middleware)

```typescript
import { createAuth } from "auth/server";
import { db } from "db/client";

const auth = createAuth(db);

const requireAuth = async (c: Context, next: Next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
};

// Use in routes
app.get("/api/protected", requireAuth, (c) => {
  const user = c.get("user");
  return c.json({ message: `Hello ${user.name}` });
});
```

### Client-side (React)

```typescript
import { authClient } from "auth/client";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
```

## TypeScript

The package is fully typed. Import types as needed:

```typescript
import type { AuthUser, AuthSession } from "auth/types";
import type { User, Session } from "auth/schema";
```

## Resources

- [Better Auth Documentation](https://www.better-auth.com/)
- [Better Auth with Hono](https://www.better-auth.com/docs/integrations/hono)
- [Better Auth with Drizzle](https://www.better-auth.com/docs/adapters/drizzle)
- [Better Auth Plugins](https://www.better-auth.com/docs/plugins)

## Scripts

Run from the root of the monorepo:

```bash
# Type check
pnpm --filter auth type-check
```
