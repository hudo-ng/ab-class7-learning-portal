import { db } from "@/db";
import { users, topics, questions } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function AdminDashboard() {
  const totalUsers = await db.$count(users);
  const pendingUsers = await db.$count(users, eq(users.isApproved, false));
  const totalTopics = await db.$count(topics);
  const totalQuestions = await db.$count(questions);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Users" value={totalUsers} />
        <Stat label="Pending approvals" value={pendingUsers} />
        <Stat label="Topics" value={totalTopics} />
        <Stat label="Questions" value={totalQuestions} />
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold">Quick actions</h2>
        <div className="flex gap-3">
          <a href="/admin/topics/new">➕ Add Topic</a>
          <a href="/admin/questions/new">➕ Add Question</a>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
