"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { setLocale } from "@/app/actions/set-locale";
import { locales, localeNames } from "@/i18n/config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LanguageSwitcher() {
  const current = useLocale();
  const t = useTranslations("Nav");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={current}
      disabled={isPending}
      onValueChange={(value) =>
        startTransition(async () => {
          await setLocale(value);
          router.refresh(); // re-render server components with the new cookie
        })
      }
    >
      <SelectTrigger size="sm" aria-label={t("language")}>
        <Languages />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {locales.map((l) => (
          <SelectItem key={l} value={l} lang={l}>
            {localeNames[l]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
