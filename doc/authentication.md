## authentication

npx auth secret
touch .env.local

```.env
DATABASE_URL=
AUTH_SECRET=db.sqlite
```

yarn add next-auth@beta drizzle-orm @auth/drizzle-adapter better-sqlite3 bcrypt
yarn add -D drizzle-kit #@types/better-sqlite3 @types/bcrypt
touch lib/config.ts lib/schema.ts lib/db.ts lib/auth.ts

config.ts

```ts
import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const config = {
  DATABASE_URL: process.env.DATABASE_URL!,
};

export default config;
```

schema.ts

```ts
import {
  integer,
  sqliteTable,
  text,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import type { AdapterAccount } from "@auth/core/adapters";
import { sql } from "drizzle-orm";

export const users = sqliteTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email"),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  password: text("password"),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  note: text("note"),
  isComplete: integer("is_complete", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_DATE`),
  addedToMyDayAt: text("added_to_my_day_at"),
  isImportant: integer("is_important", { mode: "boolean" }),
});
```

db.ts

```ts
import Database from "better-sqlite3";
import config from "./config";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/schema";

const sqlite = new Database(config.DATABASE_URL);
export const db = drizzle(sqlite, { schema, logger: true });
```

auth.ts

```ts
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "./schema";

function passwordToSalt(password: string) {
  const saltRounds = 10;
  const hash = bcrypt.hashSync(password, saltRounds);
  return hash;
}

async function getUserFromDb(username: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.name, username),
  });
  return user;
}

async function addUserToDb(username: string, saltedPassword: string) {
  const user = await db
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      name: username,
      password: saltedPassword,
    })
    .returning();
  return user.pop();
}

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        let user = null;
        const username = credentials.username as string;
        const password = credentials.password as string;

        if (!username || !password) {
          return null;
        }

        user = await getUserFromDb(username);

        if (user) {
          if (!user.password) {
            return null;
          }
          const isAuthenticated = await bcrypt.compare(password, user.password);
          if (isAuthenticated) {
            return user;
          } else {
            return null;
          }
        }

        if (!user) {
          const saltedPassword = passwordToSalt(password);
          user = await addUserToDb(username, saltedPassword);
        }

        if (!user) {
          throw new Error("User was not found and could not be created");
        }

        return user;
      },
    }),
  ],
  callbacks: {
    async session({ session, user, token }: any) {
      session.user.id = token.sub;
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});
```

touch app/api/auth/[...nextauth]/route.ts

route.ts

```ts
export { GET, POST } from "@/lib/auth";
```

touch app/componments/signin-btn.tsx app/components/session-provider.tsx

sign-in.ts

```ts
"use client";

import { signIn } from "next-auth/react";
import { Button } from "./ui/button";

export default function SignInBtn() {
  return (
    <Button onClick={() => signIn(undefined, { callbackUrl: "/tasks" })}>
      Sign In
    </Button>
  );
}
```

session-provider.ts

```ts
"use client";
import { SessionProvider } from "next-auth/react";
export default SessionProvider;
```

touch drizzle.config.ts

```ts
import { defineConfig } from "drizzle-kit";
import config from "./lib/config";

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./drizzle",
  driver: "better-sqlite",
  dbCredentials: {
    url: config.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
```

app/page.tsx

```ts
import { ModeToggle } from "@/components/mode-toggle";
import SignInBtn from "@/components/signin-btn";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { ArrowRightIcon } from "@radix-ui/react-icons";

export default async function Home() {
  const session = await auth();
  return (
    <div className="flex h-screen w-screen justify-center items-center">
      <div className="flex flex-col gap-5 text-center">
        <h1>Microsoft To Do Prototype</h1>
        <div>
          {session ? (
            <Button>
              Go to App <ArrowRightIcon className="ml-2" />
            </Button>
          ) : (
            <SignInBtn />
          )}
        </div>
      </div>
    </div>
  );
}
```

npx drizzle-kit push:sqlite

add .sqlite in .env

# Next.js Tutorial: Setting Up Authentication with NextAuth and Drizzle ORM

## Step 2: Set Up Environment Variables

You will need to set up environment variables for your database connection. Start by generating a secret and creating an .env.local file:

```bash
npx auth secret
touch .env.local
```

Then, add the following lines to your .env.local file:

```env
DATABASE_URL=db.sqlite
AUTH_SECRET=
```

## Step 3: Install Required Packages

Next, install the necessary packages:

```bash
yarn add next-auth@beta drizzle-orm @auth/drizzle-adapter better-sqlite3 bcrypt
yarn add -D drizzle-kit @types/better-sqlite3 @types/bcrypt
```

## Step 4: Create Necessary Files

Create the following files in your project structure:

```bash
touch lib/config.ts lib/schema.ts lib/db.ts lib/auth.ts
```

## Step 5: Configure Database Connection

lib/config.ts
Set up the configuration for your environment variables:

```ts
import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const config = {
  DATABASE_URL: process.env.DATABASE_URL!,
};

export default config;
```

lib/schema.ts
Define your database schema using Drizzle ORM:

```ts
import {
  integer,
  sqliteTable,
  text,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import type { AdapterAccount } from "@auth/core/adapters";
import { sql } from "drizzle-orm";

export const users = sqliteTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email"),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  password: text("password"),
});

// ... (rest of the tables as provided)
```

lib/db.ts
Set up the database connection using Better SQLite:

```ts
import Database from "better-sqlite3";
import config from "./config";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/schema";

const sqlite = new Database(config.DATABASE_URL);
export const db = drizzle(sqlite, { schema, logger: true });
```

## Step 6: Set Up Authentication Logic

lib/auth.ts
Configure NextAuth with Drizzle Adapter:

```ts
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "./schema";

async function getUserFromDb(username: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.name, username),
  });
  return user;
}

// ... (rest of the authentication logic)
```

## Step 7: Set Up API Route for Authentication

Create an API route for authentication:

```ts
touch app/api/auth/[...nextauth]/route.ts
```

app/api/auth/[...nextauth]/route.ts
Export the authentication handlers:

```ts
export { GET, POST } from "@/lib/auth";
```

## Step 8: Create Client Components

app/components/signin-btn.tsx
Create a button for signing in:

```ts
"use client";

import { signIn } from "next-auth/react";
import { Button } from "./ui/button";

export default function SignInBtn() {
  return (
    <Button onClick={() => signIn(undefined, { callbackUrl: "/tasks" })}>
      Sign In
    </Button>
  );
}
```

app/components/session-provider.tsx
Create a session provider for managing session state:

```ts
"use client";
import { SessionProvider } from "next-auth/react";

export default SessionProvider;
```

## Step 9: Configure Drizzle

Create a configuration file for Drizzle:

```bash
touch drizzle.config.ts
```

drizzle.config.ts
Set up your Drizzle configuration:

```ts
import { defineConfig } from "drizzle-kit";
import config from "./lib/config";

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./drizzle",
  driver: "better-sqlite",
  dbCredentials: {
    url: config.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
```

## Step 10: Create the Home Page

app/page.tsx
Set up the main page of your application:

```ts
import { auth } from "@/lib/auth";
import SignInBtn from "@/components/signin-btn";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@radix-ui/react-icons";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex h-screen w-screen justify-center items-center">
      <div className="flex flex-col gap-5 text-center">
        <h1>Microsoft To Do Prototype</h1>
        <div>
          {session ? (
            <Button>
              Go to App <ArrowRightIcon className="ml-2" />
            </Button>
          ) : (
            <SignInBtn />
          )}
        </div>
      </div>
    </div>
  );
}
```

Step 11: Migrate the Database
Finally, run the migration to set up your database schema:

```bash
npx drizzle-kit generate --config='./drizzle.config.ts'
npx drizzle-kit push
```

and finally add .sqlite in .ignore before git push
