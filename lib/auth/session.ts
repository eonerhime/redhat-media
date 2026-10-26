import "server-only";

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import { isStaffRole, type StaffRole } from "./roles";
import { getAuth } from "./server";

export type StaffSession = {
  userId: string;
  name: string;
  email: string;
  role: StaffRole;
  /** False until the user has set up TOTP; /cms then allows only set-up (D7). */
  twoFactorEnabled: boolean;
};

/**
 * The signed-in staff member for this request, read from the database (no cookie
 * cache, D8), or null. A deactivated user or an unknown role counts as signed out.
 * While CMS_ENABLED is off it calls notFound(): the /cms layout's own notFound()
 * does not stop a page body that renders beside it (D11).
 */
export async function getStaffSession(): Promise<StaffSession | null> {
  if (!env.cms) notFound();
  const result = await getAuth().api.getSession({ headers: await headers() });
  if (!result) return null;
  const { user } = result;
  if (user.deactivatedAt || !isStaffRole(user.role)) return null;
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled === true,
  };
}
