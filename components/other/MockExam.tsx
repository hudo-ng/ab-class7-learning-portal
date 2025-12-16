"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Question {
  questionId: string;
  prompt: string;
  explanation: string;
  choices: { choiceId: string; choiceText: string }[];
}

export default function MockExamUI({ questions }: { questions: Question[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const progress = (Object.keys(answers).length / questions.length) * 100;

  function handleSelect(questionId: string, choiceId: string) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
  }

  if (submitted) {
    return (
      <Alert className="mt-4">
        <AlertTitle>Exam Submitted!</AlertTitle>
        <AlertDescription>
          You have completed the mock exam. Review your answers and explanations
          below.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
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
                    answers[question.questionId] === choice.choiceId
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
        onClick={() => setSubmitted(true)}
      >
        Submit Exam
      </Button>
    </div>
  );
}
