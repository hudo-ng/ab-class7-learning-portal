import Link from "next/link";
import { Search, Users, X } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  getAdminUsers,
  getUserCounts,
  USER_FILTERS,
  type UserFilter,
} from "@/db/queries/admin-users";
import { AdminPageHeader } from "@/components/admin/PageHeader";
import { UserActions } from "@/components/admin/UserActions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FILTER_LABELS: Record<UserFilter, string> = {
  all: "All",
  pending: "Pending",
  approved: "Approved",
  admins: "Admins",
};

const dateFmt = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "short",
  day: "numeric",
});
const formatDate = (d: Date | null) => (d ? dateFmt.format(new Date(d)) : "—");

function href(filter: UserFilter, q: string) {
  const sp = new URLSearchParams();
  if (filter !== "all") sp.set("status", filter);
  if (q) sp.set("q", q);
  const qs = sp.toString();
  return `/admin/users${qs ? `?${qs}` : ""}`;
}

function RoleBadge({ role }: { role: string }) {
  return role === "ADMIN" ? (
    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">
      Admin
    </span>
  ) : (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
      Student
    </span>
  );
}

function StatusBadge({ approved }: { approved: boolean }) {
  return approved ? (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
      Approved
    </span>
  ) : (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
      Pending
    </span>
  );
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const filter: UserFilter = USER_FILTERS.includes(sp.status as UserFilter)
    ? (sp.status as UserFilter)
    : "all";
  const q = sp.q ?? "";

  const session = await getServerSession(authOptions);
  const [rows, counts] = await Promise.all([
    getAdminUsers({ q, filter }),
    getUserCounts(),
  ]);
  const lastAdmin = counts.admins <= 1;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Users}
        title="Users"
        description="Approve students who have paid, manage admins, and remove accounts."
      />

      <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap gap-2">
          {USER_FILTERS.map((f) => (
            <Link
              key={f}
              href={href(f, q)}
              aria-current={f === filter ? "page" : undefined}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                f === filter
                  ? "bg-slate-900 text-white"
                  : "border bg-white text-slate-700 hover:bg-slate-50",
                f === "pending" &&
                  f !== filter &&
                  counts.pending > 0 &&
                  "border-amber-300 bg-amber-50 text-amber-900",
              )}
            >
              {FILTER_LABELS[f]} ({counts[f]})
            </Link>
          ))}
        </div>

        <form className="relative max-w-md">
          {filter !== "all" && (
            <input type="hidden" name="status" value={filter} />
          )}
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search by email…"
            aria-label="Search by email"
            className="pl-9 pr-10"
          />
          {q && (
            <Button
              asChild
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
            >
              <Link href={href(filter, "")} aria-label="Clear search">
                <X className="size-4" />
              </Link>
            </Button>
          )}
        </form>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border bg-white p-8 text-center text-slate-600">
          No users found.
        </p>
      ) : (
        <>
          {/* Phones and tablets: one card per user */}
          <ul className="space-y-3 md:hidden">
            {rows.map((user) => (
              <li
                key={user.id}
                className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div className="space-y-1.5">
                  <p className="break-all font-medium text-slate-900">
                    {user.email}
                    {user.id === session?.user.id && (
                      <span className="ml-2 text-xs text-slate-500">(you)</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <RoleBadge role={user.role} />
                    {user.role !== "ADMIN" && (
                      <StatusBadge approved={user.isApproved} />
                    )}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {user.googleOnly ? "Google" : "Password"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Joined {formatDate(user.createdAt)} · Last practice{" "}
                    {formatDate(user.lastPractice)}
                  </p>
                </div>
                <UserActions
                  user={user}
                  isSelf={user.id === session?.user.id}
                  isLastAdmin={user.role === "ADMIN" && lastAdmin}
                />
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-2xl border bg-white shadow-sm md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Last practice</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((user) => (
                  <tr key={user.id} className="align-top hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="break-all font-medium text-slate-900">
                        {user.email}
                        {user.id === session?.user.id && (
                          <span className="ml-2 text-xs text-slate-500">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        {user.googleOnly
                          ? "Google sign-in"
                          : "Password sign-in"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <RoleBadge role={user.role} />
                        {user.role !== "ADMIN" && (
                          <StatusBadge approved={user.isApproved} />
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDate(user.lastPractice)}
                    </td>
                    <td className="px-4 py-3">
                      <UserActions
                        user={user}
                        isSelf={user.id === session?.user.id}
                        isLastAdmin={user.role === "ADMIN" && lastAdmin}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
