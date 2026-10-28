"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { gradeMockExam } from "@/app/actions/grade-mock-exam";
import QuestionNavigator from "./QuestionNavigator";
import clsx from "clsx";

interface Question {
  questionId: string;
  prompt: string;
  explanation: string;
  imgUrl?: string;
  choices: { choiceId: string; choiceText: string }[];
}
type ExamResult = Awaited<ReturnType<typeof gradeMockExam>>;

const PassingScore = 80;
const ExamDurationSeconds = 30 * 60;

export default function MockExamUI({ questions }: { questions: Question[] }) {
  const [answers, setAnswers] = useState<
    { questionId: string; choiceId: string }[]
  >([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [phase, setPhase] = useState<"exam" | "confirm" | "result">("exam");
  const [timeLeft, setTimeLeft] = useState(ExamDurationSeconds);
  const [currentIndex, setCurrentIndex] = useState(0);

  const progress = (Object.keys(answers).length / questions.length) * 100;
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (phase === "result") return;
    const interval = setInterval(() => {
      setTimeLeft((t) => Math.max(t - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (timeLeft === 0 && phase !== "result") {
      submitExam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  function getSelectedChoiceId(questionId: string) {
    return answers.find((a) => a.questionId === questionId)?.choiceId;
  }

  function nextQuestion() {
    setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
  }

  function prevQuestion() {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }

  function handleSelect(questionId: string, choiceId: string) {
    if (submitted) return;

    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === questionId);
      if (existing) {
        return prev.map((a) =>
          a.questionId === questionId ? { questionId, choiceId } : a,
        );
      }
      return [...prev, { questionId, choiceId }];
    });
  }

  async function submitExam() {
    const payload = questions.map((q) => ({
      questionId: q.questionId,
      choiceId: getSelectedChoiceId(q.questionId) ?? null,
    }));

    try {
      const res = await gradeMockExam(payload);
      setResult(res);
      setSubmitted(true);
      setPhase("result");
    } catch {
      alert("Could not submit the exam. Please try again.");
    }
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  if (phase === "result" && result) {
    const passed = result.score >= PassingScore;
    return (
      <Card>
        <CardHeader>Mock Exam Result</CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              {result.score}% — {passed ? "Passed 🎉" : "Failed"}
            </AlertDescription>
          </Alert>

          {questions.map((question, idx) => {
            const graded = result.details.find(
              (g) => g.questionId === question.questionId,
            );
            if (!graded) return null;
            return (
              <Card key={question.questionId}>
                <CardContent className="p-4 space-y-4">
                  {" "}
                  <p className="font-medium">
                    {idx + 1}. {question.prompt}
                  </p>
                  <div className="space-y-3">
                    {" "}
                    {question.choices.map((c) => (
                      <Button
                        key={c.choiceId}
                        disabled
                        variant="outline"
                        className={clsx(
                          "w-full justify-start text-left px-5 py-4",
                          "min-h-7 h-auto",
                          "leading-relaxed whitespace-normal items-start",
                          c.choiceId === graded.correctChoiceId &&
                            "border-green-500 bg-green-200 text-green-700",
                          c.choiceId === graded.choiceId &&
                            !graded.isCorrect &&
                            "border-red-500 bg-red-200 text-red-700",
                        )}
                      >
                        {c.choiceText}
                      </Button>
                    ))}
                  </div>
                  <Alert variant={graded.isCorrect ? "default" : "destructive"}>
                    <AlertDescription
                      className={
                        graded.isCorrect ? "text-green-700" : "text-red-700"
                      }
                    >
                      {graded.isCorrect ? "Correct" : "Incorrect"}
                    </AlertDescription>
                  </Alert>
                  <p className="text-sm text-muted-foreground font-medium">
                    {question.explanation}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <QuestionNavigator
        currentIndex={currentIndex}
        answers={answers}
        questions={questions}
        submitted={submitted}
        onJump={(idx) => setCurrentIndex(idx)}
      />
      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>
            Answered {answers.length} / {questions.length}
          </span>
          <span className="font-mono">⏱ {formatTime(timeLeft)}</span>
        </div>
        <Progress value={progress} className="h-4 rounded-md" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <p className="font-medium">
              Question {currentIndex + 1} of {questions.length}
            </p>

            <p className="text-base font-semibold leading-relaxed">
              {currentQuestion.prompt}
            </p>

            <div className="grid gap-6 md:grid-cols-[1fr_280px]">
              <div className="space-y-3">
                {currentQuestion.choices.map((choice) => (
                  <Button
                    key={choice.choiceId}
                    variant={
                      getSelectedChoiceId(currentQuestion.questionId) ===
                      choice.choiceId
                        ? "default"
                        : "outline"
                    }
                    className={clsx(
                      "w-full justify-start text-left",
                      "px-5 py-4",
                      "min-h-7",
                      "h-auto",
                      "leading-relaxed",
                      "whitespace-normal",
                      "items-start",
                      "flex-col",
                    )}
                    onClick={() =>
                      handleSelect(currentQuestion.questionId, choice.choiceId)
                    }
                  >
                    {choice.choiceText}
                  </Button>
                ))}
              </div>

              {currentQuestion.imgUrl && (
                <div className="flex justify-center md:justify-end">
                  <div className="w-full max-w-70 rounded-xl border bg-muted/30 p-3">
                    <img
                      src={currentQuestion.imgUrl}
                      alt="Question illustration"
                      className="mx-auto max-h-64 w-auto object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                disabled={currentIndex === 0}
                onClick={prevQuestion}
              >
                Previous
              </Button>

              <Button
                disabled={currentIndex === questions.length - 1}
                onClick={nextQuestion}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full"
          disabled={Object.keys(answers).length !== questions.length}
          onClick={() => setPhase("confirm")}
        >
          Submit Exam
        </Button>
        {Object.keys(answers).length !== questions.length && (
          <p className="text-xs text-muted-foreground text-center">
            Please answer all questions before submitting.
          </p>
        )}
      </div>

      <Dialog open={phase === "confirm"} onOpenChange={() => setPhase("exam")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Mock exam?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You won’t be able to change your answers after submitting.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhase("exam")}>
              Cancel
            </Button>
            <Button onClick={submitExam}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
