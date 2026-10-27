import { isStaffRole, type StaffRole } from "./roles";

// The signed-in staff member, as the guard, /api/cms/session and the /admin
// pages see them (Phase 24 spec, D7, D8; Phase 25 spec, D1, D8). No env, no
// request: the database tests map their own Better Auth instance's sessions
// through it.

export type StaffSession = {
  userId: string;
  name: string;
  email: string;
  role: StaffRole;
  /** False until the user has set up TOTP; /admin then allows only set-up (D7). */
  twoFactorEnabled: boolean;
  /** When this sign-in happened, for the 15-minute fresh check (Phase 25 spec, D3). */
  sessionCreatedAt: Date;
};

/** The parts of Better Auth's getSession() result this reads. */
export type AuthSessionResult = {
  user: {
    id: string;
    name: string;
    email: string;
    role?: string | null;
    twoFactorEnabled?: boolean | null;
    deactivatedAt?: Date | null;
  };
  session: { createdAt: Date };
} | null;

/** A deactivated user or an unknown role counts as signed out. */
export function toStaffSession(result: AuthSessionResult): StaffSession | null {
  if (!result) return null;
  const { user, session } = result;
  if (user.deactivatedAt || !isStaffRole(user.role)) return null;
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled === true,
    sessionCreatedAt: new Date(session.createdAt),
  };
}

const SESSION_COOKIES = ["better-auth.session_token", "__Secure-better-auth.session_token"];

/** Whether a Cookie header holds a session cookie at all, so a visitor costs no database read. */
export function hasSessionCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  return cookieHeader
    .split(";")
    .some((pair) => SESSION_COOKIES.includes(pair.slice(0, pair.indexOf("=")).trim()));
}
