import type { NextConfig } from "next";
// Imported for its side effect: invalid env vars fail the build (lib/env.ts).
import "./lib/env";
import { securityHeaders } from "./lib/security/headers";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    // `pnpm dev` alone adds 'unsafe-eval' to script-src (Phase 14 spec, D8).
    const dev = process.env.NODE_ENV === "development";
    return [{ source: "/:path*", headers: [...securityHeaders({ dev })] }];
  },
};

export default nextConfig;
