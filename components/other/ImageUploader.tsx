"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { uploadQuestionImage } from "@/app/actions/admin/upload-image";

export function ImageUploader({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const [pending, startTransition] = useTransition();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      const res = await uploadQuestionImage(file);
      onUploaded(res.url);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="file"
        accept="image/*"
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
  );
}
