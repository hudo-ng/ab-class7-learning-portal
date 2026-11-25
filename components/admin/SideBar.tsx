"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, HelpCircle, LayoutDashboard, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Topics", href: "/admin/topics", icon: BookOpen },
  { label: "Questions", href: "/admin/questions", icon: HelpCircle },
];

/** Sidebar on desktop; a scrollable row of tabs on phones and tablets. */
export default function AdminSideBar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      <nav
        aria-label="Admin"
        className="sticky top-0 z-10 border-b bg-white md:hidden"
      >
        <ul className="flex gap-1 overflow-x-auto px-3 py-2">
          {items.map((item) => (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium",
                  isActive(item.href)
                    ? "bg-indigo-600 text-white"
                    : "text-slate-700 hover:bg-slate-100",
                )}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <aside className="hidden w-60 shrink-0 border-r bg-white p-4 md:block">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Admin
        </p>
        <nav aria-label="Admin" className="sticky top-4">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                    isActive(item.href)
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <item.icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
