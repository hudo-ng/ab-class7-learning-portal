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
    correctChoiceId: string;
  }>(null);
  const [isPending, startTransition] = useTransition();

  const currentQuestion = questions[index];
  const totalQuestions = questions.length;
  const progress = ((index + (showExplanation ? 1 : 0)) / totalQuestions) * 100;

  function nextQuestion() {
    setSelected(null);
    setShowExplanation(false);
    setResult(null);
    setIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
  }

  function submitAnswer(choiceId: string) {
    if (result) return; // prevent double submit
    setSelected(choiceId);

    const fd = new FormData();
    fd.append("questionId", currentQuestion.questionId);
    fd.append("choiceId", choiceId);

    startTransition(async () => {
      const res = await validateUserAnswer(fd);
      setResult(res);
      setShowExplanation(true);
    });
  }

  if (!currentQuestion) {
    return (
      <Card className="p-6">
        <CardContent className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Practice Complete 🎉</h2>
          <p className="text-muted-foreground">
            You've finished all {totalQuestions} questions.
          </p>
          <Button onClick={() => setIndex(0)}>Restart Practice</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Question {index + 1} of {totalQuestions}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <h2 className="text-xl font-semibold leading-relaxed">
          {currentQuestion.prompt}
        </h2>

        {currentQuestion.imgUrl && (
          <div className="flex justify-center">
            <div className="w-full max-w-md rounded-xl border bg-muted/30 p-3">
              <img
                src={currentQuestion.imgUrl}
                alt="Question illustration"
                className="mx-auto max-h-64 w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        )}

        <div className="space-y-3">
          {currentQuestion.choices.map((choice) => {
            const isSelected = selected === choice.choiceId;
            const isCorrectChoice =
              result && result.correctChoiceId === choice.choiceId;
            const isWrongChoice = isSelected && result && !result.isCorrect;

            return (
              <Button
                key={choice.choiceId}
                disabled={!!result || isPending}
                variant="outline"
                className={clsx(
                  "w-full justify-start text-left px-5 py-4",
                  "min-h-7 h-auto",
                  "leading-relaxed whitespace-normal items-start",
                  "transition-all duration-200",
                  isCorrectChoice &&
                    "border-green-600 bg-green-50 text-green-900 font-medium",
                  isWrongChoice &&
                    "border-red-600 bg-red-50 text-red-900 font-medium",
                  result && !isSelected && !isCorrectChoice && "opacity-65",
                  isPending && "opacity-70 cursor-wait"
                )}
                onClick={() => submitAnswer(choice.choiceId)}
              >
                {choice.text}
              </Button>
            );
          })}
        </div>

        {result && (
          <Alert
            variant={result.isCorrect ? "default" : "destructive"}
            className="mt-4"
          >
            <AlertDescription className="text-base font-medium">
              {result.isCorrect
                ? "Correct! Well done."
                : "Incorrect. The correct answer is highlighted above."}
            </AlertDescription>
          </Alert>
        )}

        {showExplanation && (
          <div className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed border">
            <p className="font-medium text-muted-foreground mb-1">
              Explanation:
            </p>
            {currentQuestion.explanation}
          </div>
        )}

        {showExplanation && (
          <Button
            className="w-full mt-2"
            size="lg"
            onClick={nextQuestion}
            disabled={index === totalQuestions - 1}
          >
            {index === totalQuestions - 1 ? "Finish Practice" : "Next Question"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
