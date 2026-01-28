"use server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, is } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function approveUser(fd: FormData): Promise<void> {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const userId = fd.get("userId") as string;
  const approved = fd.get("approved") === "true";

  await db
    .update(users)
    .set({ isApproved: approved })
    .where(eq(users.id, userId));

  revalidatePath("/admin/users");
}
