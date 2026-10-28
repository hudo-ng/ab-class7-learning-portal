"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { editQuestion } from "@/app/actions/admin/edit-question";
import { ImageUploader } from "./ImageUploader";

// `key` is only for React; new choices have no `id` until saved
interface ChoiceState {
  id?: string;
  key: string;
  text: string;
  isCorrect: boolean;
}

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
  const [choices, setChoices] = useState<ChoiceState[]>(
    question.choices.map((c) => ({ ...c, key: c.id })),
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function updateChoice(
    index: number,
    field: "text" | "isCorrect",
    value: string | boolean,
  ) {
    setChoices((prev) =>
      prev.map((c, i) =>
        i === index
          ? { ...c, [field]: value }
          : field === "isCorrect"
            ? { ...c, isCorrect: false }
            : c,
      ),
    );
  }

  function addChoice() {
    setChoices((prev) => [
      ...prev,
      { key: crypto.randomUUID(), text: "", isCorrect: false },
    ]);
  }

  function removeChoice(index: number) {
    setChoices((prev) => prev.filter((_, i) => i !== index));
  }

  function submit() {
    setError(null);
    setOk(false);
    startTransition(async () => {
      try {
        await editQuestion({
          id: question.id,
          topicId: question.topicId,
          prompt,
          explanation,
          imgUrl,
          isActive,
          choices: choices.map(({ id, text, isCorrect }) => ({
            id,
            text,
            isCorrect,
          })),
        });
        setOk(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Update failed");
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

      <ImageUploader
        onUploaded={(url) => {
          setImgUrl(url);
        }}
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
        {choices.map((c, i) => (
          <div key={c.key} className="flex gap-2 items-center">
            <input
              type="radio"
              checked={c.isCorrect}
              onChange={() => updateChoice(i, "isCorrect", true)}
            />
            <Input
              placeholder={`Choice ${i + 1}`}
              value={c.text}
              onChange={(e) => updateChoice(i, "text", e.target.value)}
            />
            {choices.length > 2 && (
              <Button type="button" onClick={() => removeChoice(i)}>
                X
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addChoice}>
          Add Choice
        </Button>
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
