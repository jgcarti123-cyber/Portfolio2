import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Shown in the footer; Vercel provides the commit SHA at build time.
    NEXT_PUBLIC_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
