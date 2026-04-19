import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["face-api.js"],

  async headers() {
    return [
      {
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },

  // Allow server actions to receive larger payloads (e.g., data URLs from forms).
  // The banner upload uses /api/upload (API route, not server action), so this
  // is belt-and-suspenders for any future server action that touches files.
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
      },
      // Vercel Blob — allows next/image to optimize banner/avatar URLs
      {
        protocol: "https",
        hostname: "*.private.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;