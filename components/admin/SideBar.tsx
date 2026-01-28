import Link from "next/link";
import { LayoutDashboard, BookOpen, HelpCircle, Users } from "lucide-react";

const items = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Manage Users", href: "/admin/users", icon: Users },
  { label: "Learn Topics", href: "/admin/topics", icon: BookOpen },
  { label: "Practice Questions", href: "/admin/questions", icon: HelpCircle },
];

export default function AdminSideBar() {
  return (
    <aside className="w-64 border-r bg-background p-4 space-y-6">
      <div className="text-lg font-bold">Admin</div>

      <nav className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
