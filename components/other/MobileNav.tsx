"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import LogoutButton from "./LogoutButton";

interface Props {
  items: { href: string; label: string }[];
  signedIn: boolean;
}

// Phone-sized navigation: a menu button that opens a side panel (hidden from md up)
export default function MobileNav({ items, signedIn }: Props) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={t("menu")}
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>AB Class 7</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col px-2">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                aria-current={active ? "page" : undefined}
                className={
                  "rounded-md px-3 py-3 text-base font-medium hover:bg-muted " +
                  (active ? "bg-muted" : "")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <SheetFooter>
          {signedIn ? (
            <LogoutButton />
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href="/login" onClick={close}>
                  {t("login")}
                </Link>
              </Button>
              <Button asChild>
                <Link href="/register" onClick={close}>
                  {t("signUp")}
                </Link>
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
