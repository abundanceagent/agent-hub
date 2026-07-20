import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow image / PDF uploads through Server Actions (default is 1MB).
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
