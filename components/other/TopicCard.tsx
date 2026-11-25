import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { topicStyle } from "@/lib/learn-topics";
import { cn } from "@/lib/utils";
import { MasteredBadge, ProgressBar, type ProgressData } from "./TopicProgress";

/** Colourful topic card used on /learn and /practice. The whole card is the link. */
export function TopicCard({
  slug,
  title,
  description,
  number,
  href,
  cta,
  progress,
  startHere = false,
}: {
  slug: string;
  title: string;
  description?: string | null;
  number: number;
  href: string;
  cta: string;
  /** Only passed for approved students */
  progress?: ProgressData;
  startHere?: boolean;
}) {
  const t = useTranslations("Learn");
  const { icon: Icon, accent } = topicStyle(slug);
  const mastered = progress?.complete ?? false;

  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full flex-col gap-3 rounded-xl border border-t-4 bg-card p-5 shadow-sm transition",
        "hover:-translate-y-0.5 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        accent.bar,
        accent.hover,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full",
            accent.icon,
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            accent.text,
          )}
        >
          {t("topicNumber", { number })}
        </span>
        {mastered ? (
          <MasteredBadge className="ml-auto" />
        ) : (
          startHere && (
            <span className="ml-auto rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-medium text-white">
              {t("startHere")}
            </span>
          )
        )}
      </div>

      <div className="space-y-1">
        <h2 className="text-lg font-semibold leading-snug text-slate-900">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {progress && !mastered && (
        <ProgressBar progress={progress} accent={accent} />
      )}

      <span
        className={cn(
          "mt-auto flex items-center justify-end gap-1 pt-1 text-sm font-medium",
          accent.text,
        )}
      >
        {cta}
        <ArrowRight
          className="size-4 transition group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}
