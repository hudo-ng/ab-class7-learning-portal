import { db } from "@/db";
import { answerAttempts, users } from "@/db/schema";
import { and, desc, eq, ilike, sql, type SQL } from "drizzle-orm";

export type UserFilter = "all" | "pending" | "approved" | "admins";

export const USER_FILTERS: UserFilter[] = [
  "all",
  "pending",
  "approved",
  "admins",
];

const filterWhere: Record<UserFilter, SQL | undefined> = {
  all: undefined,
  pending: eq(users.isApproved, false),
  approved: eq(users.isApproved, true),
  admins: eq(users.role, "ADMIN"),
};

/** Users for the admin list, newest first, with their last practice date. */
export async function getAdminUsers({
  q = "",
  filter = "all",
}: {
  q?: string;
  filter?: UserFilter;
}) {
  const lastPractice = db
    .select({
      userId: answerAttempts.userId,
      last: sql<Date>`max(${answerAttempts.createdAt})`
        .mapWith(answerAttempts.createdAt)
        .as("last"),
    })
    .from(answerAttempts)
    .groupBy(answerAttempts.userId)
    .as("lp");

  const search = q.trim();
  return db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      isApproved: users.isApproved,
      createdAt: users.createdAt,
      googleOnly: sql<boolean>`${users.hashedPassword} is null`,
      lastPractice: lastPractice.last,
    })
    .from(users)
    .leftJoin(lastPractice, eq(lastPractice.userId, users.id))
    .where(
      and(
        filterWhere[filter],
        search ? ilike(users.email, `%${search}%`) : undefined,
      ),
    )
    .orderBy(desc(users.createdAt));
}

/** Counts for the filter tabs and dashboard. */
export async function getUserCounts() {
  const [row] = await db
    .select({
      all: sql<number>`count(*)::int`,
      pending: sql<number>`(count(*) filter (where ${users.isApproved} = false))::int`,
      approved: sql<number>`(count(*) filter (where ${users.isApproved} = true))::int`,
      admins: sql<number>`(count(*) filter (where ${users.role} = 'ADMIN'))::int`,
    })
    .from(users);
  return row as Record<UserFilter, number>;
}
