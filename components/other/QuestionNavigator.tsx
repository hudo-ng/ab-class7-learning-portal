import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  currentIndex: number;
  answers: { questionId: string; choiceId: string }[];
  questions: { questionId: string }[];
  onJump: (index: number) => void;
}

function Grid({ currentIndex, answers, questions, onJump }: Props) {
  const t = useTranslations("MockExam");
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-10 lg:grid-cols-5">
        {questions.map((q, idx) => {
          const isAnswered = answers.some((a) => a.questionId === q.questionId);
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={q.questionId}
              type="button"
              onClick={() => onJump(idx)}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={t("goToQuestion", {
                number: idx + 1,
                status: isAnswered
                  ? t("legendAnswered")
                  : t("legendUnanswered"),
              })}
              className={clsx(
                "flex aspect-square items-center justify-center rounded-lg text-sm font-semibold transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
                isAnswered
                  ? "bg-violet-600 text-white hover:bg-violet-700"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                isCurrent && "ring-2 ring-amber-400 ring-offset-2",
              )}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-violet-600" aria-hidden="true" />
          {t("legendAnswered")}
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="size-3 rounded border border-slate-300 bg-white"
            aria-hidden="true"
          />
          {t("legendUnanswered")}
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="size-3 rounded ring-2 ring-amber-400"
            aria-hidden="true"
          />
          {t("legendCurrent")}
        </li>
      </ul>
    </div>
  );
}

/** Question grid: folded on phones and tablets, always open in the desktop sidebar. */
export default function QuestionNavigator(props: Props) {
  const t = useTranslations("MockExam");
  const title = t("navigatorTitle", { answered: props.answers.length });
  return (
    <>
      <details className="group rounded-xl border bg-white lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
          {title}
          <ChevronDown
            className="size-4 text-slate-500 transition group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="border-t p-4">
          <Grid {...props} />
        </div>
      </details>

      <nav
        aria-label={title}
        className="hidden rounded-xl border bg-white p-4 lg:block"
      >
        <p className="mb-3 text-sm font-semibold text-slate-900">{title}</p>
        <Grid {...props} />
      </nav>
    </>
  );
}
