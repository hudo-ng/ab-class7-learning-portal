import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();
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

export default withNextIntl(nextConfig);
