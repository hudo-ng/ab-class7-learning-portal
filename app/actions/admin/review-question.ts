"use server";

import { db } from "@/db";
import { questions } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function setQuestionActive(fd: FormData): Promise<void> {
  await requireAdmin();

  const questionId = String(fd.get("questionId") ?? "");
  const active = fd.get("active") === "true";
  if (!questionId) throw new Error("Missing question");

  await db
    .update(questions)
    .set({ isActive: active })
    .where(eq(questions.id, questionId));

  revalidatePath("/admin/questions");
}

export async function deleteQuestion(fd: FormData): Promise<void> {
  await requireAdmin();

  const questionId = String(fd.get("questionId") ?? "");
  if (!questionId) throw new Error("Missing question");

  // Choices are removed with the question (ON DELETE CASCADE)
  await db.delete(questions).where(eq(questions.id, questionId));

  revalidatePath("/admin/questions");
}
