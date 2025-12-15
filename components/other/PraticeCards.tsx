"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateUserAnswer } from "@/app/actions/validate-answer";

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

  function nextQuestion() {
    setSelected(null);
    setShowExplanation(false);
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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <p className="font-medium">{currentQuestion.prompt}</p>
        <div className="space-y-2">
          {currentQuestion.choices.map((choice, idx) => (
            <Button
              key={choice.choiceId}
              className="m-1"
              variant={selected === choice.choiceId ? "secondary" : "default"}
              onClick={() => submitAnswer(choice.choiceId)}
            >
              {choice.text}
            </Button>
          ))}
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
