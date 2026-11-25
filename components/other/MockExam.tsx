"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Lightbulb,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { gradeMockExam } from "@/app/actions/grade-mock-exam";
import {
  EXAM_BLUEPRINT,
  EXAM_DURATION_MINUTES,
  PASS_MARK,
} from "@/lib/exam-blueprint";
import QuestionNavigator from "./QuestionNavigator";

interface Question {
  questionId: string;
  prompt: string;
  explanation: string;
  imgUrl?: string;
  choices: { choiceId: string; choiceText: string }[];
  translated?: boolean;
}
type ExamResult = Awaited<ReturnType<typeof gradeMockExam>>;
type Phase = "intro" | "exam" | "confirm" | "result";

const LETTERS = "ABCDEFGH";
const TOPIC_COUNT = Object.keys(EXAM_BLUEPRINT).length;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Letter badge used for answer choices. */
function Letter({ index, className }: { index: number; className?: string }) {
  return (
    <span
      className={clsx(
        "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        className,
      )}
      aria-hidden="true"
    >
      {LETTERS[index]}
    </span>
  );
}

export default function MockExamUI({
  questions: initialQuestions,
}: {
  questions: Question[];
}) {
  const t = useTranslations("MockExam");
  const tCommon = useTranslations("Common");
  // Freeze the set the student started with; a page re-render must not swap it mid-exam
  const [questions] = useState(initialQuestions);
  const [answers, setAnswers] = useState<
    { questionId: string; choiceId: string }[]
  >([]);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION_MINUTES * 60);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const total = questions.length;
  const currentQuestion = questions[currentIndex];
  const allAnswered = answers.length === total;

  // The clock only runs once the student presses Start
  useEffect(() => {
    if (phase !== "exam" && phase !== "confirm") return;
    const interval = setInterval(() => {
      setTimeLeft((s) => Math.max(s - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (timeLeft === 0 && (phase === "exam" || phase === "confirm")) {
      submitExam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  function getSelectedChoiceId(questionId: string) {
    return answers.find((a) => a.questionId === questionId)?.choiceId;
  }

  function handleSelect(questionId: string, choiceId: string) {
    if (phase === "result") return;
    setAnswers((prev) => {
      const others = prev.filter((a) => a.questionId !== questionId);
      return [...others, { questionId, choiceId }];
    });
  }

  async function submitExam() {
    if (submitting) return;
    setSubmitting(true);
    const payload = questions.map((q) => ({
      questionId: q.questionId,
      choiceId: getSelectedChoiceId(q.questionId) ?? null,
    }));
    try {
      const res = await gradeMockExam(payload);
      setResult(res);
      setPhase("result");
      window.scrollTo({ top: 0 });
    } catch {
      alert(t("submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  // ── Start screen ────────────────────────────────────────────────
  if (phase === "intro") {
    const percent = Math.round((PASS_MARK / total) * 100);
    const stats = [
      { value: String(total), label: t("statQuestions") },
      {
        value: t("statMinutes", { minutes: EXAM_DURATION_MINUTES }),
        label: t("statTimeLabel"),
      },
      { value: String(PASS_MARK), label: t("statPassLabel", { percent }) },
    ];
    return (
      <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-8 space-y-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">
          {t("startTitle")}
        </h2>
        <dl className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-violet-50 p-3 text-center sm:p-4"
            >
              <dt className="sr-only">{s.label}</dt>
              <dd className="text-2xl font-bold text-violet-700 sm:text-3xl">
                {s.value}
              </dd>
              <dd className="mt-1 text-xs text-slate-600 sm:text-sm">
                {s.label}
              </dd>
            </div>
          ))}
        </dl>
        <ul className="space-y-2 text-sm text-slate-700">
          {[t("rule1", { topics: TOPIC_COUNT }), t("rule2"), t("rule3")].map(
            (rule) => (
              <li key={rule} className="flex items-start gap-2">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-violet-600"
                  aria-hidden="true"
                />
                {rule}
              </li>
            ),
          )}
        </ul>
        <Button
          size="lg"
          className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto"
          onClick={() => setPhase("exam")}
        >
          {t("start")}
        </Button>
      </section>
    );
  }

  // ── Results ─────────────────────────────────────────────────────
  if (phase === "result" && result) {
    return (
      <Results
        questions={questions}
        result={result}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // ── Exam ────────────────────────────────────────────────────────
  const lowTime = timeLeft <= 60;
  const warnTime = timeLeft <= 5 * 60;
  const selected = getSelectedChoiceId(currentQuestion.questionId);

  return (
    <>
      {/* Stays at the top while scrolling */}
      <div className="sticky top-0 z-20 -mx-4 border-b bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-slate-700">
            {t("answered", { answered: answers.length, total })}
          </span>
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono font-semibold tabular-nums",
              lowTime
                ? "bg-red-100 text-red-700"
                : warnTime
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-700",
            )}
            role="timer"
            aria-label={t("timeLeft")}
          >
            <Clock className="size-4" aria-hidden="true" />
            {formatTime(timeLeft)}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-violet-600 transition-all"
            style={{ width: `${(answers.length / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-6">
        <div className="space-y-4">
          <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
              {t("questionOf", { current: currentIndex + 1, total })}
            </p>
            <h2 className="text-lg sm:text-xl font-semibold leading-relaxed text-slate-900">
              {currentQuestion.prompt}
            </h2>
            {currentQuestion.translated && (
              <p className="text-xs italic text-slate-500">
                {tCommon("unofficialTranslation")}
              </p>
            )}

            {currentQuestion.imgUrl && (
              <div className="flex justify-center">
                <div className="w-full max-w-xs rounded-xl border bg-slate-50 p-3">
                  <img
                    src={currentQuestion.imgUrl}
                    alt={tCommon("questionImageAlt")}
                    className="mx-auto max-h-56 w-auto object-contain"
                  />
                </div>
              </div>
            )}

            <div
              className="space-y-3"
              role="group"
              aria-label={currentQuestion.prompt}
            >
              {currentQuestion.choices.map((choice, i) => {
                const isSelected = selected === choice.choiceId;
                return (
                  <button
                    key={choice.choiceId}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() =>
                      handleSelect(currentQuestion.questionId, choice.choiceId)
                    }
                    className={clsx(
                      "flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
                      isSelected
                        ? "border-violet-600 bg-violet-50"
                        : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/40",
                    )}
                  >
                    <Letter
                      index={i}
                      className={
                        isSelected
                          ? "bg-violet-600 text-white"
                          : "bg-slate-100 text-slate-700"
                      }
                    />
                    <span className="flex-1 pt-0.5 leading-relaxed text-slate-800">
                      {choice.choiceText}
                    </span>
                    {isSelected && (
                      <Check
                        className="mt-1 size-5 shrink-0 text-violet-600"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <Button
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                {t("previous")}
              </Button>
              <Button
                variant="outline"
                disabled={currentIndex === total - 1}
                onClick={() =>
                  setCurrentIndex((i) => Math.min(i + 1, total - 1))
                }
              >
                {t("next")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </section>

          <div className="space-y-2">
            <Button
              size="lg"
              className="w-full bg-violet-600 hover:bg-violet-700"
              disabled={!allAnswered}
              onClick={() => setPhase("confirm")}
            >
              {t("submit")}
            </Button>
            {!allAnswered && (
              <p className="text-center text-xs text-slate-500">
                {t("answerAll")}
              </p>
            )}
          </div>
        </div>

        <aside className="mt-4 lg:sticky lg:top-24 lg:mt-0">
          <QuestionNavigator
            currentIndex={currentIndex}
            answers={answers}
            questions={questions}
            onJump={setCurrentIndex}
          />
        </aside>
      </div>

      <Dialog
        open={phase === "confirm"}
        onOpenChange={(open) => !open && setPhase("exam")}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("confirmBody")}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhase("exam")}>
              {t("cancel")}
            </Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700"
              disabled={submitting}
              onClick={submitExam}
            >
              {t("confirmSubmit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Results({
  questions,
  result,
  onRetry,
}: {
  questions: Question[];
  result: ExamResult;
  onRetry: () => void;
}) {
  const t = useTranslations("MockExam");
  const [onlyMistakes, setOnlyMistakes] = useState(false);
  const total = questions.length;
  const passed = result.correct >= PASS_MARK;
  const wrong = result.details.filter((d) => !d.isCorrect).length;
  const byId = new Map(result.details.map((d) => [d.questionId, d]));
  const shown = questions
    .map((q, idx) => ({ q, idx, graded: byId.get(q.questionId) }))
    .filter((x) => x.graded && (!onlyMistakes || !x.graded.isCorrect));

  return (
    <div className="space-y-6">
      <section
        className={clsx(
          "rounded-2xl border p-5 sm:p-8 space-y-5",
          passed
            ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50"
            : "border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h2
              className={clsx(
                "flex items-center gap-2 text-2xl font-bold",
                passed ? "text-emerald-800" : "text-rose-800",
              )}
            >
              {passed ? (
                <CheckCircle2 className="size-7" aria-hidden="true" />
              ) : (
                <XCircle className="size-7" aria-hidden="true" />
              )}
              {passed ? t("passedTitle") : t("failedTitle")}
            </h2>
            <p className="text-sm text-slate-700">
              {passed ? t("passedBody") : t("failedBody", { pass: PASS_MARK })}
            </p>
          </div>
          <p className="text-right">
            <span className="block text-3xl font-bold tabular-nums text-slate-900">
              {result.correct} / {total}
            </span>
            <span className="text-sm font-medium text-slate-600">
              {result.score}%
            </span>
          </p>
        </div>

        {/* Score bar with a marker at the pass mark */}
        <div className="space-y-1">
          <div className="relative h-3 rounded-full bg-white/80">
            <div
              className={clsx(
                "h-full rounded-full",
                passed ? "bg-emerald-500" : "bg-rose-500",
              )}
              style={{ width: `${(result.correct / total) * 100}%` }}
            />
            <div
              className="absolute -top-1 h-5 w-0.5 bg-slate-700"
              style={{ left: `${(PASS_MARK / total) * 100}%` }}
              aria-hidden="true"
            />
          </div>
          <p className="text-xs text-slate-600">
            {t("passMarkAt", { pass: PASS_MARK, total })}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {wrong > 0 && (
            <Button
              variant="outline"
              className="bg-white"
              onClick={() => {
                setOnlyMistakes(true);
                document
                  .getElementById("review")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {t("reviewMistakes")}
            </Button>
          )}
          <Button asChild variant="outline" className="bg-white">
            <Link href="/practice">{t("backToPractice")}</Link>
          </Button>
          <Button
            className="bg-violet-600 hover:bg-violet-700"
            onClick={onRetry}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            {t("newExam")}
          </Button>
        </div>
      </section>

      <section id="review" className="scroll-mt-6 space-y-4">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t("reviewTitle")}
        >
          {[
            { only: false, label: t("filterAll", { count: total }) },
            { only: true, label: t("filterIncorrect", { count: wrong }) },
          ].map((f) => (
            <button
              key={String(f.only)}
              type="button"
              aria-pressed={onlyMistakes === f.only}
              onClick={() => setOnlyMistakes(f.only)}
              className={clsx(
                "rounded-full px-4 py-1.5 text-sm font-medium transition",
                onlyMistakes === f.only
                  ? "bg-slate-900 text-white"
                  : "border bg-white text-slate-700 hover:bg-slate-50",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {shown.length === 0 && (
          <p className="rounded-xl border bg-white p-5 text-center text-slate-600">
            {t("noMistakes")}
          </p>
        )}

        {shown.map(({ q, idx, graded }) => {
          if (!graded) return null;
          return (
            <article
              key={q.questionId}
              className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6 space-y-4"
            >
              <h3 className="flex items-start gap-2 font-semibold leading-relaxed text-slate-900">
                {graded.isCorrect ? (
                  <CheckCircle2
                    className="mt-0.5 size-5 shrink-0 text-emerald-600"
                    aria-label={t("correct")}
                  />
                ) : (
                  <XCircle
                    className="mt-0.5 size-5 shrink-0 text-rose-600"
                    aria-label={t("incorrect")}
                  />
                )}
                <span>
                  {idx + 1}. {q.prompt}
                </span>
              </h3>

              {q.imgUrl && (
                <img
                  src={q.imgUrl}
                  alt=""
                  className="max-h-40 w-auto rounded-lg border bg-slate-50 p-2"
                />
              )}

              <ul className="space-y-2">
                {q.choices.map((c, i) => {
                  const isCorrect = c.choiceId === graded.correctChoiceId;
                  const isMine = c.choiceId === graded.choiceId;
                  return (
                    <li
                      key={c.choiceId}
                      className={clsx(
                        "flex items-start gap-3 rounded-xl border px-4 py-2.5",
                        isCorrect
                          ? "border-emerald-300 bg-emerald-50"
                          : isMine
                            ? "border-rose-300 bg-rose-50"
                            : "border-slate-200",
                      )}
                    >
                      <Letter
                        index={i}
                        className={
                          isCorrect
                            ? "bg-emerald-600 text-white"
                            : isMine
                              ? "bg-rose-600 text-white"
                              : "bg-slate-100 text-slate-600"
                        }
                      />
                      <span className="flex-1 pt-0.5 leading-relaxed text-slate-800">
                        {c.choiceText}
                        {(isCorrect || isMine) && (
                          <span
                            className={clsx(
                              "mt-1 flex flex-wrap gap-x-3 text-xs font-semibold",
                              isCorrect ? "text-emerald-700" : "text-rose-700",
                            )}
                          >
                            {isCorrect && <span>✓ {t("correctAnswer")}</span>}
                            {isMine && (
                              <span>
                                {isCorrect ? "" : "✗ "}
                                {t("yourAnswer")}
                              </span>
                            )}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {graded.choiceId === null && (
                <p className="text-sm font-medium text-rose-700">
                  {t("notAnswered")}
                </p>
              )}

              <div className="flex gap-2 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                <Lightbulb
                  className="mt-0.5 size-4 shrink-0 text-amber-500"
                  aria-hidden="true"
                />
                <p>
                  <span className="font-semibold">{t("explanation")}: </span>
                  {q.explanation}
                </p>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
