import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Development only: lets 127.0.0.1 act as a second, cookie-less browser when testing.
  allowedDevOrigins: ["127.0.0.1"],
  env: {
    // Shown in the footer; Vercel provides the commit SHA at build time.
    NEXT_PUBLIC_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
