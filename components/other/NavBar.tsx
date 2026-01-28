import { NAV_ITEMS } from "@/lib/navItems";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Button } from "../ui/button";

export default async function NavBar() {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role ?? "guest";
  return (
    <header className="border-b bg-background">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold">
            {" "}
            AB Class 7{" "}
          </Link>
          <nav className="flex items-center gap-4">
            {NAV_ITEMS.map((item) => {
              if (!item.auth) return renderLink(item);
              if (item.auth === "user" && session) return renderLink(item);
              if (item.auth === "admin" && userRole === "ADMIN")
                return renderLink(item);
              return null;
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {!session ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/logout">Logout</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function renderLink(item: { label: string; href: string }) {
  return (
    <Link
      key={item.href}
      href={item.href}
      className="text-sm font-medium hover:underline"
    >
      {item.label}
    </Link>
  );
}
