"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { uploadQuestionImage } from "@/app/actions/admin/upload-image";

const MAX_SIZE = 4 * 1024 * 1024;

export function ImageUploader({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (file.size > MAX_SIZE) {
      setError("File size exceeds 4MB limit");
      return;
    }

    startTransition(async () => {
      try {
        const res = await uploadQuestionImage(file);
        if ("error" in res) {
          setError(res.error ?? "Upload failed. Please try again.");
          return;
        }
        onUploaded(res.url);
      } catch {
        setError("Upload failed. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          id="image-upload"
          onChange={onFileChange}
        />
        <label htmlFor="image-upload">
          <Button type="button" variant="outline" disabled={pending} asChild>
            <span>{pending ? "Uploading..." : "Upload Image"}</span>
          </Button>
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
