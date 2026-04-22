import type { NextConfig } from "next";
import path from "path";

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

  // Turbopack is the default dev server in Next.js 16; no custom config needed.
  // The empty object silences the "webpack config present but no turbopack config" warning.
  turbopack: {},

  webpack: (config) => {
    // A stray package.json at /Desktop confuses webpack's resolver into looking
    // for node_modules there instead of here. Pin module resolution to this dir.
    config.resolve.modules = [
      path.resolve(__dirname, "node_modules"),
      "node_modules",
    ];
    return config;
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