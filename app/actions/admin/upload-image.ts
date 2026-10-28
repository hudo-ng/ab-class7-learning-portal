"use server";

import { requireAdmin } from "@/lib/auth";
import { put } from "@vercel/blob";

const MAX_SIZE = 4 * 1024 * 1024; // 4 MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function uploadQuestionImage(file: File) {
  await requireAdmin();

  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file provided" };
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return { error: "Only PNG, JPEG, WebP or GIF images are allowed" };
  }

  if (file.size > MAX_SIZE) {
    return { error: "Image must be 4 MB or smaller" };
  }

  const blob = await put(`questions/image.${ext}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type,
  });

  return { url: blob.url };
}
