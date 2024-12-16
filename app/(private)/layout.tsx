import AppShell from "@/components/app-shell";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/schema";
import { and, count, eq, gte } from "drizzle-orm";
import { SessionProvider } from "next-auth/react";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { format } from "date-fns";

export default async function Layout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  // Guard clause to check if session or session.user.id is not defined
  if (!session || !session.user.id) {
    return <div>Please log in to see your tasks.</div>;
  } // instead of session?.user.id! because it is unsafe

  const myDayCount = await db
    .select({ value: count() })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, session?.user.id),
        gte(tasks.addedToMyDayAt, format(new Date(), "yyyy-MM-dd")),
        eq(tasks.isComplete, false)
      )
    );
  const importantCount = await db
    .select({ value: count() })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, session.user.id!),
        eq(tasks.isImportant, true),
        eq(tasks.isComplete, false)
      )
    );
  const taskCount = await db
    .select({ value: count() })
    .from(tasks)
    .where(
      and(eq(tasks.userId, session.user.id!), eq(tasks.isComplete, false))
    );
  const taskCounts = {
    myDay: myDayCount[0].value,
    important: importantCount[0].value,
    tasks: taskCount[0].value,
  };

  return (
    <SessionProvider session={session}>
      <AppShell taskCounts={taskCounts}>{children}</AppShell>
    </SessionProvider>
  );
}
