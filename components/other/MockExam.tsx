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

interface Question {
  questionId: string;
  prompt: string;
  explanation: string;
  choices: { choiceId: string; choiceText: string }[];
}

const PassingScore = 80;
const ExamDurationSeconds = 30 * 60;

export default function MockExamUI({ questions }: { questions: Question[] }) {
  const [answers, setAnswers] = useState<
    { questionId: string; choiceId: string }[]
  >([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<null | any>(null);
  const [phase, setPhase] = useState<"exam" | "confirm" | "result">("exam");
  const [timeLeft, setTimeLeft] = useState(ExamDurationSeconds);

  const progress = (Object.keys(answers).length / questions.length) * 100;

  useEffect(() => {
    if (phase === "exam") return;

    if (timeLeft <= 0) {
      submitExam();
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, timeLeft]);

  function getSelectedChoiceId(questionId: string) {
    return answers.find((a) => a.questionId === questionId)?.choiceId;
  }

  function handleSelect(questionId: string, choiceId: string) {
    if (submitted) return;

    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === questionId);
      if (existing) {
        return prev.map((a) =>
          a.questionId === questionId ? { questionId, choiceId } : a
        );
      }
      return [...prev, { questionId, choiceId }];
    });
  }

  async function submitExam() {
    const res = await gradeMockExam(answers);
    setResult(res);
    setSubmitted(true);
    setPhase("result");
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  if (phase === "result") {
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
              (g: any) => (g.questionId = question.questionId)
            );
            return (
              <Card key={question.questionId}>
                <CardContent className="p-4 space-y-2">
                  <p className="font-medium">
                    {idx + 1}. {question.prompt}
                  </p>
                  <Alert variant={graded.isCorrect ? "default" : "destructive"}>
                    <AlertDescription>
                      {graded.isCorrect ? "Correct" : "Incorrect"}
                    </AlertDescription>
                  </Alert>
                  <p className="text-sm text-muted-foreground">
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
      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>
            Answered {answers.length} / {questions.length}
          </span>
          <span className="font-mono">⏱ {formatTime(timeLeft)}</span>
        </div>
        <Progress value={progress} className="h-4 rounded-md" />
        {questions.map((question, idx) => (
          <Card key={question.questionId}>
            <CardContent className="p-4 space-y-3">
              <p className="font-medium">
                {idx + 1}. {question.prompt}
              </p>
              <div className="space-y-2">
                {question.choices.map((choice) => (
                  <Button
                    key={choice.choiceId}
                    variant={
                      getSelectedChoiceId(question.questionId) ===
                      choice.choiceId
                        ? "default"
                        : "outline"
                    }
                    className="w-full justify-start m-1"
                    onClick={() =>
                      handleSelect(question.questionId, choice.choiceId)
                    }
                  >
                    {choice.choiceText}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        <Button
          className="w-full"
          disabled={Object.keys(answers).length !== questions.length}
          onClick={() => setPhase("confirm")}
        >
          Submit Exam
        </Button>
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
