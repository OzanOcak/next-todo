## initial set-up and toggle

yarn install react@18 react-dom@18  
yarn add @radix-ui/react-icons next-themes

// layout.tsx

```tsx
const fontSans = FontSans({ subsets: ["latin"], variable: "--font-sans" });

<html lang="en" suppressHydrationWarning>
      <body className={cn("font-sans", fontSans.variable)}>
```

```tsx
import { ThemeProvider } from "@/components/theme-provider";

<ThemeProvider
  attribute="class"
  defaultTheme="system" // system, dark, light
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>;
```

## authentication

npx auth secret
touch .env.local

```.env
DATABASE_URL=db.sqlite
AUTH_SECRET=
```

yarn add next-auth@beta drizzle-orm @auth/drizzle-adapter better-sqlite3 bcrypt
yarn add -D drizzle-kit #@types/better-sqlite3 @types/bcrypt
touch lib/config.ts lib/schema.ts lib/db.ts lib/auth.ts
touch app/api/auth/[...nextauth]/route.ts
touch app/componments/signin-btn.tsx app/components/session-provider.tsx

touch drizzle.config

npx drizzle-kit push:sqlite

add .sqlite in .env
