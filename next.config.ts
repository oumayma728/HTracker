import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Service worker for push notifications: always fetch the latest version, and only run same-origin scripts
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      // Journey PDF upload: the action itself rejects files over 10MB; this leaves room for form-data overhead
      bodySizeLimit: "11mb",
    },
    // proxy.ts buffers request bodies; keep its limit in line with the Server Action limit above
    proxyClientMaxBodySize: "11mb",
  },
};

export default nextConfig;
