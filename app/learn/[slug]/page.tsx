import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import {
  getLocalizedLessonBlocks,
  getLocalizedTopics,
} from "@/db/queries/localized";
import { LessonBlock } from "@/components/other/LessonBlock";
import {
  MobileContents,
  SidebarContents,
  type ContentsItem,
} from "@/components/other/LessonContents";
import { Button } from "@/components/ui/button";
import { sortByStudyOrder, topicStyle } from "@/lib/learn-topics";
import { cn } from "@/lib/utils";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();

  // All topics in study order: gives this topic's number and the next topic
  const topics = sortByStudyOrder(await getLocalizedTopics(locale));
  const index = topics.findIndex((t) => t.slug === slug);
  if (index === -1) notFound();
  const topic = topics[index];
  const next = topics[index + 1] ?? null;

  const t = await getTranslations("Learn");
  const tCommon = await getTranslations("Common");
  const messages = await getMessages();
  const descriptions: Record<string, string> = messages.Learn.topics;
  const signNames: Record<string, string> = messages.Signs;
  const { icon: Icon, accent } = topicStyle(topic.slug);

  const blocks = await getLocalizedLessonBlocks(topic.id, locale);
  const hasTranslation = blocks.some((b) => b.translated);

  // Number the ordinary sections; summaries get icons instead of numbers
  let n = 0;
  const sections = blocks.map((block, i) => ({
    block,
    anchor: `section-${i + 1}`,
    number:
      block.type === "concept" || block.type === "visual" ? ++n : undefined,
  }));
  const contents: ContentsItem[] = sections
    .filter((s) => s.block.type !== "intro")
    .map((s) => ({
      anchor: s.anchor,
      title: s.block.title,
      type: s.block.type,
      number: s.number,
    }));
  const contentsLabel = t("contents", { count: contents.length });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <Link
        href="/learn"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t("allTopics")}
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
          <div className="min-w-0 space-y-2">
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-wide",
                accent.text,
              )}
            >
              {t("topicOf", { number: index + 1, total: topics.length })}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-slate-900">
              {topic.title}
            </h1>
            {descriptions[topic.slug] && (
              <p className="text-slate-600">{descriptions[topic.slug]}</p>
            )}
            {hasTranslation && (
              <p className="text-xs italic text-slate-500">
                {tCommon("unofficialTranslation")}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
        <aside>
          <SidebarContents
            items={contents}
            accent={accent}
            label={contentsLabel}
          />
        </aside>

        <article className="min-w-0 max-w-3xl space-y-8 sm:space-y-10">
          <MobileContents
            items={contents}
            accent={accent}
            label={contentsLabel}
          />

          {sections.map(({ block, anchor, number }) => (
            <LessonBlock
              key={block.id}
              block={block}
              anchor={anchor}
              number={number}
              accent={accent}
              signNames={signNames}
            />
          ))}

          <section className="rounded-2xl border bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                {t("readyTitle")}
              </h2>
              <p className="text-sm text-slate-600">{t("readyBody")}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href={`/practice/${topic.slug}`}>
                  {t("practiceTopic")}
                </Link>
              </Button>
              {next ? (
                <Link
                  href={`/learn/${next.slug}`}
                  className="group inline-flex items-center justify-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900 sm:justify-end"
                >
                  <span>
                    {t("nextTopic")}:{" "}
                    <span className="font-semibold">{next.title}</span>
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 transition group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              ) : (
                <Link
                  href="/learn"
                  className="inline-flex items-center justify-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  {t("backToTopics")}
                </Link>
              )}
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
