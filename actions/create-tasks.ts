"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/schema";
import { revalidatePath } from "next/cache";

export type CreateTaskSchema = {
  title: string;
  isImportant: boolean;
  addedToMyDayAt?: string;
};

export async function createTask(data: CreateTaskSchema) {
  const session = await auth();

  // Check for session and user ID
  if (!session || !session.user.id) {
    return {
      message: "unauthenticated",
    };
  }

  // Ensure userId is a string and title is provided
  const dataToInsert = {
    userId: session.user.id,
    title: data.title,
    isImportant: data.isImportant,
    addedToMyDayAt: data.addedToMyDayAt,
  };

  // Insert task into the database
  await db.insert(tasks).values(dataToInsert);

  revalidatePath("/tasks");
}
