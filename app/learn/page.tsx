import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { getLocalizedTopics } from "@/db/queries/localized";
import { sortByStudyOrder, topicStyle } from "@/lib/learn-topics";
import { cn } from "@/lib/utils";

export default async function LearnIndexPage() {
  const topics = sortByStudyOrder(await getLocalizedTopics(await getLocale()));
  const t = await getTranslations("Learn");

  // Descriptions are keyed by slug; a new topic without one still gets a card
  const descriptions: Record<string, string> = (await getMessages()).Learn
    .topics;
  const describe = (slug: string) => descriptions[slug] ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10 space-y-8">
      <header className="flex items-start gap-4 rounded-2xl bg-gradient-to-br from-sky-50 via-indigo-50 to-violet-50 p-6 sm:p-8">
        <span className="hidden sm:flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
          <GraduationCap className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {t("title")}
          </h1>
          <p className="text-slate-600">{t("subtitle")}</p>
        </div>
      </header>

      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic, i) => {
          const { icon: Icon, accent } = topicStyle(topic.slug);
          const description = describe(topic.slug);
          return (
            <li key={topic.id}>
              <Link
                href={`/learn/${topic.slug}`}
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
                    {t("topicNumber", { number: i + 1 })}
                  </span>
                  {i === 0 && (
                    <span className="ml-auto rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-medium text-white">
                      {t("startHere")}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-semibold leading-snug text-slate-900">
                    {topic.title}
                  </h2>
                  {description && (
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  )}
                </div>

                <span
                  className={cn(
                    "mt-auto flex items-center justify-end gap-1 text-sm font-medium",
                    accent.text,
                  )}
                >
                  {t("readLesson")}
                  <ArrowRight
                    className="size-4 transition group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
