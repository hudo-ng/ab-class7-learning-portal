"use client";

import { useState } from "react";
import { createQuesion } from "@/app/actions/admin/create-question";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageUploader } from "./ImageUploader";

interface Topic {
  id: string;
  title: string;
  slug: string;
}

export default function CreateQuestionForm({ topics }: { topics: Topic[] }) {
  const [topicId, setTopicId] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [imgUrl, setImgUrl] = useState("");
  const [explanation, setExplanation] = useState<string>("");
  const [choices, setChoices] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function updateChoice(
    index: number,
    field: "text" | "isCorrect",
    value: string | boolean
  ) {
    setChoices((prev) =>
      prev.map((c, i) =>
        i === index
          ? { ...c, [field]: value }
          : field === "isCorrect"
          ? { ...c, isCorrect: false }
          : c
      )
    );
  }

  function addChoice() {
    setChoices((prev) => [...prev, { text: "", isCorrect: false }]);
  }

  function removeChoice(index: number) {
    setChoices((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit() {
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      await createQuesion({ topicId, explanation, prompt, choices, imgUrl });
      setLoading(false);
      setPrompt("");
      setExplanation("");
      setImgUrl("");
      setChoices([
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ]);
      setOk("Saved ✅");
    } catch (err) {
      console.log(err);
      setErr(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <div className="text-sm font-medium">Topic</div>
        <Select value={topicId} onValueChange={setTopicId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a topic..." />
          </SelectTrigger>
          <SelectContent>
            {topics.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Textarea
        placeholder="Question prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <Textarea
        placeholder="Explanation"
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
      />

      <div className="space-y-2">
        <div className="text-sm font-medium">Image (optional)</div>

        <ImageUploader
          onUploaded={(url) => {
            setImgUrl(url);
          }}
        />

        <Input
          placeholder="https://example.com/road-sign.png"
          value={imgUrl}
          onChange={(e) => setImgUrl(e.target.value)}
        />

        {imgUrl && (
          <div className="border rounded-md p-2 max-w-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgUrl}
              alt="Question visual"
              className="w-full object-contain"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="font-medium">Choices</p>
        {choices.map((c, i) => (
          <div key={i} className="flex gap-2 items-center">
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
      <Button onClick={submit} disabled={loading}>
        {loading ? "Saving..." : "Save Question"}
      </Button>

      {err && (
        <Alert variant="destructive">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}

      {ok && (
        <Alert>
          <AlertDescription>{ok}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
