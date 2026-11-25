import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  HelpCircle,
  LayoutDashboard,
  Plus,
  ShieldCheck,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db";
import { questions, topics } from "@/db/schema";
import { getAdminUsers, getUserCounts } from "@/db/queries/admin-users";
import { AdminPageHeader } from "@/components/admin/PageHeader";
import { UserActions } from "@/components/admin/UserActions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Stat({
  icon: Icon,
  label,
  value,
  href,
  tone,
  highlight = false,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  href: string;
  tone: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        highlight && "border-amber-300 bg-amber-50",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          tone,
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-bold tabular-nums text-slate-900">
          {value}
        </span>
        <span className="block text-xs font-medium text-slate-600">
          {label}
        </span>
      </span>
    </Link>
  );
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const [counts, totalTopics, totalQuestions, needsReview, pendingUsers] =
    await Promise.all([
      getUserCounts(),
      db.$count(topics),
      db.$count(questions),
      db.$count(questions, eq(questions.isActive, false)),
      getAdminUsers({ filter: "pending" }),
    ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="An overview of students and course content."
      >
        <Button asChild size="sm">
          <Link href="/admin/questions/new">
            <Plus className="size-4" aria-hidden="true" />
            Add question
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/topics/new">
            <Plus className="size-4" aria-hidden="true" />
            Add topic
          </Link>
        </Button>
      </AdminPageHeader>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <Stat
          icon={UserCheck}
          label="Waiting for approval"
          value={counts.pending}
          href="/admin/users?status=pending"
          tone="bg-amber-100 text-amber-700"
          highlight={counts.pending > 0}
        />
        <Stat
          icon={Users}
          label="Users"
          value={counts.all}
          href="/admin/users"
          tone="bg-sky-100 text-sky-700"
        />
        <Stat
          icon={ShieldCheck}
          label="Admins"
          value={counts.admins}
          href="/admin/users?status=admins"
          tone="bg-violet-100 text-violet-700"
        />
        <Stat
          icon={BookOpen}
          label="Topics"
          value={totalTopics}
          href="/admin/topics"
          tone="bg-emerald-100 text-emerald-700"
        />
        <Stat
          icon={HelpCircle}
          label="Questions"
          value={totalQuestions}
          href="/admin/questions"
          tone="bg-indigo-100 text-indigo-700"
        />
        <Stat
          icon={ClipboardList}
          label="Questions to review"
          value={needsReview}
          href="/admin/questions?status=inactive"
          tone="bg-rose-100 text-rose-700"
          highlight={needsReview > 0}
        />
      </div>

      <section className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Waiting for approval
          </h2>
          {pendingUsers.length > 0 && (
            <Link
              href="/admin/users?status=pending"
              className="text-sm font-medium text-indigo-700 hover:underline"
            >
              View all
            </Link>
          )}
        </div>
        {pendingUsers.length === 0 ? (
          <p className="text-sm text-slate-600">
            Nobody is waiting. New sign-ups will appear here.
          </p>
        ) : (
          <ul className="divide-y">
            {pendingUsers.slice(0, 5).map((user) => (
              <li
                key={user.id}
                className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="break-all font-medium text-slate-900">
                    {user.email}
                  </p>
                  <p className="text-xs text-slate-500">
                    Signed up{" "}
                    {new Intl.DateTimeFormat("en-CA", {
                      month: "short",
                      day: "numeric",
                    }).format(new Date(user.createdAt))}{" "}
                    · {user.googleOnly ? "Google" : "Password"}
                  </p>
                </div>
                <UserActions
                  user={user}
                  isSelf={user.id === session?.user.id}
                  isLastAdmin={false}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
