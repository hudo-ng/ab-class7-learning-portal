import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { MASTERY_CORRECT, MASTERY_WINDOW } from "@/lib/exam-blueprint";
import type { TopicAccent } from "@/lib/learn-topics";
import { cn } from "@/lib/utils";

export interface ProgressData {
  answered: number;
  correct: number;
  complete: boolean;
}

/** Green "Mastered" pill, shown when the practice goal is met. */
export function MasteredBadge({ className }: { className?: string }) {
  const t = useTranslations("Progress");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800",
        className,
      )}
    >
      <CheckCircle2 className="size-3.5" aria-hidden="true" />
      {t("mastered")}
    </span>
  );
}

/**
 * Practice progress toward the mastery goal (MASTERY_CORRECT of the last
 * MASTERY_WINDOW questions). Same numbers as the Practice page and mock exam lock.
 */
export function ProgressBar({
  progress,
  accent,
}: {
  progress: ProgressData;
  accent: TopicAccent;
}) {
  const t = useTranslations("Progress");
  const { answered, correct, complete } = progress;

  if (complete) return <MasteredBadge />;
  if (answered === 0) {
    return <p className="text-xs text-slate-500">{t("notStarted")}</p>;
  }

  const shown = Math.min(correct, MASTERY_CORRECT);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-medium text-slate-700">
        <span>{t("practice")}</span>
        <span>{t("score", { correct: shown, goal: MASTERY_CORRECT })}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label={t("practice")}
        aria-valuemin={0}
        aria-valuemax={MASTERY_CORRECT}
        aria-valuenow={shown}
      >
        <div
          className={cn("h-full rounded-full transition-all", accent.fill)}
          style={{ width: `${(shown / MASTERY_CORRECT) * 100}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">
        {t("detail", { correct, answered, window: MASTERY_WINDOW })}
      </p>
    </div>
  );
}

/** "4 of 9 topics mastered" with an overall bar, for page headers. */
export function MasterySummary({
  done,
  total,
  children,
}: {
  done: number;
  total: number;
  children?: React.ReactNode;
}) {
  const t = useTranslations("Progress");
  return (
    <div className="space-y-2 rounded-xl bg-white/70 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">
          {t("summary", { done, total })}
        </p>
        {children}
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-label={t("summary", { done, total })}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${total ? (done / total) * 100 : 0}%` }}
        />
      </div>
      {done < total && (
        <p className="text-xs text-slate-600">
          {t("summaryHint", { goal: MASTERY_CORRECT, window: MASTERY_WINDOW })}
        </p>
      )}
    </div>
  );
}
