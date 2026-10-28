import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Access denied");
  }
  return session;
}

export async function requireApprovedUser() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Please log in");
  }
  if (!session.user.isApproved) {
    throw new Error("Your account is not approved yet");
  }
  return session;
}
