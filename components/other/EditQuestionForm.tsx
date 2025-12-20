"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EditQuestion } from "@/app/actions/admin/edit-question";

interface QuestionData {
  id: string;
  topicId: string;
  topicTitle: string;
  topicSlug: string;
  prompt: string;
  explanation: string;
  imgUrl?: string;
  isActive: boolean;
  choices: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

export default function EditQuestionForm({
  question,
}: {
  question: QuestionData;
}) {
  const [prompt, setPrompt] = useState(question.prompt);
  const [explanation, setExplanation] = useState(question.explanation);
  const [imgUrl, setImgUrl] = useState(question.imgUrl);
  const [isActive, setIsActive] = useState(question.isActive);
  const [choices, setChoices] = useState(question.choices);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function updateChoice(
    index: number,
    field: "text" | "isCorrect",
    value: any
  ) {
    setChoices((prev) =>
      prev.map((c: any, i: number) =>
        i === index
          ? { ...c, [field]: value }
          : field === "isCorrect"
          ? { ...c, isCorrect: false }
          : c
      )
    );
  }

  function submit() {
    setError(null);
    setOk(false);
    startTransition(async () => {
      try {
        await EditQuestion({
          id: question.id,
          topicId: question.topicId,
          prompt,
          explanation,
          imgUrl,
          isActive,
          choices,
        });
        setOk(true);
      } catch (e: any) {
        setError(e.message || "Update failed");
      }
    });
  }
  return (
    <div className="space-y-6 max-w-2xl">
      <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />

      <Textarea
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
      />

      <Input
        placeholder="Image URL"
        value={imgUrl}
        onChange={(e) => setImgUrl(e.target.value)}
      />

      {imgUrl && (
        <img
          src={imgUrl}
          className="max-h-40 object-contain border rounded-md"
          alt="Preview"
        />
      )}

      <div className="flex items-center gap-2">
        <Switch checked={isActive} onCheckedChange={setIsActive} />
        <span className="text-sm">Active</span>
      </div>

      <div className="space-y-3">
        {choices.map((c: any, i: number) => (
          <div key={c.id} className="flex gap-2 items-center">
            <input
              type="radio"
              checked={c.isCorrect}
              onChange={() => updateChoice(i, "isCorrect", true)}
            />
            <Input
              value={c.text}
              onChange={(e) => updateChoice(i, "text", e.target.value)}
            />
          </div>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {ok && (
        <Alert>
          <AlertDescription>Saved successfully ✅</AlertDescription>
        </Alert>
      )}

      <Button onClick={submit} disabled={pending}>
        {pending ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
