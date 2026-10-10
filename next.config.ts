import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
