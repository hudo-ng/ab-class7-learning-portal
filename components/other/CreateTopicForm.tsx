"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createTopic } from "@/app/actions/admin/create-topic";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CreateNewTopicForm() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function onTitleChange(value: string) {
    setTitle(value);
    setSlug(slugify(value));
  }

  function submit() {
    setError(null);
    setOk(false);

    const fd = new FormData();
    fd.append("title", title);
    fd.append("slug", slug);

    startTransition(async () => {
      try {
        await createTopic(fd);
        setOk(true);
        setTitle("");
        setSlug("");
      } catch (e: any) {
        setError(e.message || "Failed to creat topic");
      }
    });
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Topic title (e.g. Road Signs)"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
      />

      <Input
        placeholder="Slug (e.g. road-signs)"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {ok && (
        <Alert>
          <AlertDescription>Topic created ✅</AlertDescription>
        </Alert>
      )}

      <Button onClick={submit} disabled={pending || !title} className="w-full">
        {pending ? "Saving..." : "Save Topic"}
      </Button>

      {ok && <Button onClick={() => setOk(false)}>Add another topic</Button>}
    </div>
  );
}
