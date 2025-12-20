"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { validateUserAnswer } from "@/app/actions/validate-answer";
import clsx from "clsx";

interface Choice {
  choiceId: string;
  text: string;
}

interface Question {
  questionId: string;
  prompt: string;
  explanation: string;
  imgUrl?: string | null;
  choices: Choice[];
}

export function PracticeCards({ questions }: { questions: Question[] }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [result, setResult] = useState<null | {
    isCorrect: boolean;
    explanation: string;
  }>(null);
  const [isPending, startTransition] = useTransition();

  const currentQuestion = questions[index];
  const totalQuestions = questions.length;
  const progress = ((index + (showExplanation ? 1 : 0)) / totalQuestions) * 100;

  function nextQuestion() {
    setSelected(null);
    setShowExplanation(false);
    setResult(null);
    setIndex((prev) => Math.min(prev + 1, questions.length - 1));
  }

  function submitAnswer(choiceId: string) {
    const fd = new FormData();
    fd.append("questionId", currentQuestion.questionId);
    fd.append("choiceId", choiceId);
    startTransition(async () => {
      const res = await validateUserAnswer(fd);
      setResult(res);
      setSelected(choiceId);
      setShowExplanation(true);
    });
  }

  if (!currentQuestion) {
    return (
      <Card className="p-6">
        <CardContent>
          <h2 className="text-xl font-semibold">Practice complete 🎉</h2>
          <p className="text-muted-foreground">
            You’ve finished all questions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Question {index + 1} of {totalQuestions}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <p className="font-medium">{currentQuestion.prompt}</p>
        {currentQuestion.imgUrl && (
          <div className="flex justify-center">
            <div className="w-full max-w-sm rounded-lg border bg-muted/30 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentQuestion.imgUrl}
                alt="Question illustration"
                className="mx-auto max-h-56 w-auto object-contain"
              />
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          {currentQuestion.choices.map((choice) => {
            const isSelected = selected === choice.choiceId;
            const variant = !result
              ? "outline"
              : isSelected && result.isCorrect
              ? "default"
              : isSelected && !result.isCorrect
              ? "destructive"
              : "secondary";
            return (
              <Button
                key={choice.choiceId}
                disabled={!!result || isPending}
                variant={variant}
                className={clsx(
                  "justify-start m-1",
                  result && !isSelected && "opacity-70"
                )}
                onClick={() => submitAnswer(choice.choiceId)}
              >
                {choice.text}
              </Button>
            );
          })}
        </div>

        {result && (
          <Alert variant={result.isCorrect ? "default" : "destructive"}>
            <AlertDescription>
              {result.isCorrect ? "Correct!" : "Incorrect."}
            </AlertDescription>
          </Alert>
        )}

        {showExplanation && (
          <div className="rounded-md bg-muted p-3 text-sm">
            {currentQuestion.explanation}
          </div>
        )}

        {showExplanation && (
          <Button className="w-full" onClick={nextQuestion}>
            Next Question
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
