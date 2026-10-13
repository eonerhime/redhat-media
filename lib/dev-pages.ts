// Developer fixture pages under app/(dev)/ (Phase 8 spec, D11). They are
// never served by the production deployment; previews and local builds show them.

import type { Env } from "@/lib/env";

export function isDevPagesEnabled(env: Pick<Env, "vercelEnv">): boolean {
  return env.vercelEnv !== "production";
}
