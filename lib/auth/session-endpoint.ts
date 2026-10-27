import type { StaffRole } from "./roles";
import { hasSessionCookie, type StaffSession } from "./staff-session";

// GET /api/cms/session (Phase 25 spec, D8; tech-stack.md → In-place CMS 1), the
// browser's one way to ask "which staff role am I?", as MRU's edit-session.
// Always 200 while the CMS is on: "no role" is an answer, not an error. `role`
// stays null until 2FA is set up, so no staff UI appears before then. It is a
// read, not a mutation, so it carries no guard. app/api/cms/session/route.ts
// passes it the request and the real session reader.

export type CmsSessionAnswer = { role: StaffRole | null; authenticated: boolean };

const noStore = { "Cache-Control": "no-store" };

export function sessionAnswer(staff: StaffSession | null): CmsSessionAnswer {
  if (!staff) return { role: null, authenticated: false };
  return { role: staff.twoFactorEnabled ? staff.role : null, authenticated: true };
}

export async function cmsSessionResponse(
  request: Request,
  deps: { cmsEnabled: boolean; readSession: (headers: Headers) => Promise<StaffSession | null> },
): Promise<Response> {
  if (!deps.cmsEnabled) return new Response("Not found", { status: 404, headers: noStore });
  // No session cookie: a visitor, answered without touching the database.
  const staff = hasSessionCookie(request.headers.get("cookie"))
    ? await deps.readSession(request.headers)
    : null;
  return Response.json(sessionAnswer(staff), { headers: noStore });
}
