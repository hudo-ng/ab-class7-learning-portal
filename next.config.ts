import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      new URL("https://adqvuag38e1wwvsm.public.blob.vercel-storage.com"),
    ],
  },
};

export default nextConfig;
