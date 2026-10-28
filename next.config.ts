import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns: [
      new URL("https://adqvuag38e1wwvsm.public.blob.vercel-storage.com"),
    ],
  },
};

export default nextConfig;
