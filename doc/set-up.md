## initial set-up and toggle

yarn create next-app

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
