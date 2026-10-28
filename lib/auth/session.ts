import "server-only";

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import { getAuth } from "./server";
import { type StaffSession, toStaffSession } from "./staff-session";

export type { StaffSession } from "./staff-session";

/**
 * The signed-in staff member for these request headers, read from the database
 * (no cookie cache, D8), or null. Callers check `env.cms` first: getAuth() throws
 * while the CMS is off. requireRole() and /api/cms/session read through this.
 */
export async function readStaffSession(requestHeaders: Headers): Promise<StaffSession | null> {
  return toStaffSession(await getAuth().api.getSession({ headers: requestHeaders }));
}

/**
 * The signed-in staff member for this request, or null. A deactivated user or an
 * unknown role counts as signed out. While CMS_ENABLED is off it calls notFound():
 * the /admin layout's own notFound() does not stop a page body that renders
 * beside it (D11).
 */
export async function getStaffSession(): Promise<StaffSession | null> {
  if (!env.cms) notFound();
  return readStaffSession(await headers());
}
