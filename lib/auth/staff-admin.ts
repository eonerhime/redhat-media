// Owner-run staff account changes (Phase 24 spec, D10, D12), used by
// scripts/auth-seed-admin.mts and scripts/auth-reset-password.mts until the
// Phase 33 admin screens exist, and by the tests. They write through Prisma with
// the client they are given, hash passwords exactly as Better Auth does, and
// record each script's change as an AuditEvent in the same transaction.
// Relative imports only: it runs under plain Node.

import { generateRandomString, hashPassword } from "better-auth/crypto";
import { audit } from "../audit/audit.ts";
import type { PrismaClient } from "../generated/prisma/client.ts";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./options.ts";
import type { StaffRole } from "./roles.ts";

type Db = Pick<PrismaClient, "user" | "account" | "session" | "twoFactor" | "$transaction">;

/** Better Auth's ID shape: 32 alphanumeric characters. */
export function newAuthId(): string {
  return generateRandomString(32, "a-z", "A-Z", "0-9");
}

/** A random password for the owner scripts: 24 characters from 62, about 143 bits. */
export function newStaffPassword(): string {
  return generateRandomString(24, "a-z", "A-Z", "0-9");
}

function checkPassword(password: string): void {
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH)
    throw new Error(`Password must be ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters`);
}

/** Creates a staff account with a password and no 2FA. Tests call it directly; the seed script goes through seedAdmin(). */
export async function createStaffUser(
  db: Pick<PrismaClient, "user">,
  input: { email: string; name: string; role: StaffRole; password: string },
): Promise<{ id: string; email: string }> {
  checkPassword(input.password);
  const id = newAuthId();
  const email = input.email.trim().toLowerCase();
  await db.user.create({
    data: {
      id,
      email,
      name: input.name.trim(),
      role: input.role,
      emailVerified: true,
      accounts: {
        create: {
          id: newAuthId(),
          accountId: id,
          providerId: "credential",
          password: await hashPassword(input.password),
        },
      },
    },
  });
  return { id, email };
}

/**
 * The seed script's first admin, with its `auth.admin_seeded` AuditEvent in the
 * same transaction (Phase 25 spec, D7). The owner ran it, so there is no actor.
 */
export async function seedAdmin(
  db: Pick<PrismaClient, "$transaction">,
  input: { email: string; name: string; password: string },
): Promise<{ id: string; email: string }> {
  return db.$transaction(async (tx) => {
    const user = await createStaffUser(tx, { ...input, role: "admin" });
    await audit(tx, {
      actorId: null,
      action: "auth.admin_seeded",
      entityType: "user",
      entityId: user.id,
      diff: { role: "admin" },
    });
    return user;
  });
}

/**
 * Sets a new password, ends every session and clears both locks. With
 * `reset2fa`, also removes the user's 2FA, so the next sign-in sets it up again.
 * The `auth.password_reset` AuditEvent is written in the same transaction (Phase
 * 25 spec, D7). Returns false when no such user exists.
 */
export async function resetStaffPassword(
  db: Db,
  input: { email: string; password: string; reset2fa?: boolean },
): Promise<boolean> {
  checkPassword(input.password);
  const user = await db.user.findUnique({
    where: { email: input.email.trim().toLowerCase() },
    select: { id: true },
  });
  if (!user) return false;
  const hash = await hashPassword(input.password);
  const reset2fa = input.reset2fa === true;
  await db.$transaction(async (tx) => {
    await tx.account.updateMany({
      where: { userId: user.id, providerId: "credential" },
      data: { password: hash },
    });
    await tx.session.deleteMany({ where: { userId: user.id } });
    await tx.user.update({
      where: { id: user.id },
      data: {
        failedSignInCount: 0,
        lockedUntil: null,
        ...(reset2fa ? { twoFactorEnabled: false } : {}),
      },
    });
    if (reset2fa) await tx.twoFactor.deleteMany({ where: { userId: user.id } });
    else
      await tx.twoFactor.updateMany({
        where: { userId: user.id },
        data: { failedVerificationCount: 0, lockedUntil: null },
      });
    await audit(tx, {
      actorId: null,
      action: "auth.password_reset",
      entityType: "user",
      entityId: user.id,
      diff: { reset2fa },
    });
  });
  return true;
}
