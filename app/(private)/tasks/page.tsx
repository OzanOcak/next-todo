import AddTask from "@/components/add-task";
import TaskList from "@/components/task-list";
import TaskListCompleted from "@/components/task-list-completed";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
export default async function Page() {
  const session = await auth();

  // Check if session and user ID are valid
  if (!session || !session.user.id) {
    return (
      <div className="flex flex-col text-accent-blue-foreground p-5">
        <h1 className="font-bold text-3xl">Tasks</h1>
        <div>Please log in to view your tasks.</div>
      </div>
    );
  }

  const res = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, session.user.id), eq(tasks.isComplete, false)));

  const resCompleted = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, session.user.id), eq(tasks.isComplete, true)));

  return (
    <div className="flex flex-col text-accent-blue-foreground p-5 gap-5">
      <h1 className="font-bold text-3xl">Tasks</h1>
      {res.length > 0 ? (
        <div>
          <TaskList tasks={res} accentClassName="text-accent-blue-foreground" />
        </div>
      ) : (
        <div>
          Tasks show up here if they are not part of any lists you have created.
        </div>
      )}
      <div>
        <TaskListCompleted tasks={resCompleted} />
      </div>
      <div>
        <AddTask className="text-accent-blue-foreground bg-accent hover:bg-accent/50" />
      </div>
    </div>
  );
}
