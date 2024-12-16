"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/schema";
import { revalidatePath } from "next/cache";

export async function createTask(title: string) {
  const session = await auth();

  // Check for session and user ID
  if (!session || !session.user.id) {
    return {
      message: "unauthenticated",
    };
  }

  // Ensure userId is a string and title is provided
  const userId = session.user.id;

  // Insert task into the database
  await db.insert(tasks).values({
    userId, // Ensure userId is correctly typed
    title,
    // Include other required fields if necessary
  });

  revalidatePath("/tasks");
}
