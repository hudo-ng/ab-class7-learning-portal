"use server";

import { put } from "@vercel/blob";

export async function uploadQuestionImage(file: File) {
  if (!file) {
    throw new Error("No file provided");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image file allowed");
  }

  const blob = await put(`questions/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  return {
    url: blob.url,
  };
}
