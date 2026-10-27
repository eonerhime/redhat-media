import { connection } from "next/server";
import { cmsSessionResponse } from "@/lib/auth/session-endpoint";
import { readStaffSession } from "@/lib/auth/session";
import { env } from "@/lib/env";

// The staff role for the header icon and, from Phase 26, EditModeProvider
// (Phase 25 spec, D8). A 404 while CMS_ENABLED is off, like /api/auth.

export async function GET(request: Request): Promise<Response> {
  await connection(); // answered per request, never prerendered (C2)
  return cmsSessionResponse(request, {
    cmsEnabled: env.cms !== undefined,
    readSession: readStaffSession,
  });
}
