import { isAllowedAuthPath, isTrustedRequestOrigin } from "@/lib/auth/paths";
import { getAuth } from "@/lib/auth/server";
import { env } from "@/lib/env";

// Better Auth's HTTP endpoints (Phase 24 spec). While CMS_ENABLED is off, and
// for any endpoint outside the allowlist in lib/auth/paths.ts, the answer is a
// plain 404, the same as for a path that never existed (D11). A POST from an
// origin outside trustedOrigins gets 403 before Better Auth sees it (D9).

const noStore = { "Cache-Control": "no-store" };

async function handle(request: Request): Promise<Response> {
  if (!env.cms || !isAllowedAuthPath(new URL(request.url).pathname))
    return new Response("Not found", { status: 404, headers: noStore });
  if (!isTrustedRequestOrigin(request, env.cms.trustedOrigins))
    return new Response("Forbidden", { status: 403, headers: noStore });
  return getAuth().handler(request);
}

export { handle as GET, handle as POST };
