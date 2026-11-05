import { NAV_ITEMS } from "@/lib/navItems";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Button } from "../ui/button";
import LogoutButton from "./LogoutButton";
import LanguageSwitcher from "./LanguageSwitcher";

export default async function NavBar() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations("Nav");
  const userRole = session?.user?.role ?? "guest";

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.auth) return true;
    if (item.auth === "user") return !!session;
    if (item.auth === "admin") return userRole === "ADMIN";
    return false;
  });

  return (
    <header className="border-b bg-background">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold">
            AB Class 7
          </Link>
          <nav className="flex items-center gap-4">
            {visibleItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium hover:underline"
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {!session ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">{t("login")}</Link>
              </Button>
              <Button asChild>
                <Link href="/register">{t("signUp")}</Link>
              </Button>
            </>
          ) : (
            <LogoutButton />
          )}
        </div>
      </div>
    </header>
  );
}
