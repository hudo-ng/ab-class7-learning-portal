import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { topicStyle } from "@/lib/learn-topics";
import { cn } from "@/lib/utils";

/**
 * Topic-coloured page header shared by lesson and practice pages:
 * back link, "Topic N of M", title, description, and optional extras.
 */
export function TopicHeader({
  slug,
  title,
  description,
  number,
  total,
  backHref,
  backLabel,
  children,
}: {
  slug: string;
  title: string;
  description?: string | null;
  number: number;
  total: number;
  backHref: string;
  backLabel: string;
  children?: React.ReactNode;
}) {
  const t = useTranslations("Learn");
  const { icon: Icon, accent } = topicStyle(slug);

  return (
    <>
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {backLabel}
      </Link>

      <header className={cn("mt-4 rounded-2xl border p-5 sm:p-8", accent.soft)}>
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "hidden sm:flex size-12 shrink-0 items-center justify-center rounded-xl",
              accent.icon,
            )}
          >
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-wide",
                accent.text,
              )}
            >
              {t("topicOf", { number, total })}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-slate-900">
              {title}
            </h1>
            {description && <p className="text-slate-600">{description}</p>}
            {children}
          </div>
        </div>
      </header>
    </>
  );
}
