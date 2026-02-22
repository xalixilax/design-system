# @repo/database

Drizzle ORM package for the monorepo with PostgreSQL support.

## Setup

1. Copy `.env.example` to `.env` and configure your database URL:
```bash
cp .env.example .env
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the PostgreSQL database:
```bash
docker-compose up -d
```

## Usage

### Generate migrations
```bash
pnpm db:generate
```

### Run migrations
```bash
pnpm db:migrate
```

### Push schema changes (for development)
```bash
pnpm db:push
```

### Open Drizzle Studio
```bash
pnpm db:studio
```

## Import in other packages

```typescript
import { db } from "@repo/database/client";
import { users } from "@repo/database/schema";

// Query example
const allUsers = await db.select().from(users);

// Insert example
await db.insert(users).values({
  name: "John Doe",
  email: "john@example.com"
});
```
