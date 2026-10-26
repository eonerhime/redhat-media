// Owner-run staff account changes (Phase 24 spec, D10, D12), used by
// scripts/auth-seed-admin.mts and scripts/auth-reset-password.mts until the
// Phase 33 admin screens exist, and by the tests. They write through Prisma with
// the client they are given and hash passwords exactly as Better Auth does.
// Relative imports only: it runs under plain Node.

import { generateRandomString, hashPassword } from "better-auth/crypto";
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

export async function createStaffUser(
  db: Db,
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
 * Sets a new password, ends every session and clears both locks. With
 * `reset2fa`, also removes the user's 2FA, so the next sign-in sets it up again.
 * Returns false when no such user exists.
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
  await db.$transaction([
    db.account.updateMany({
      where: { userId: user.id, providerId: "credential" },
      data: { password: hash },
    }),
    db.session.deleteMany({ where: { userId: user.id } }),
    db.user.update({
      where: { id: user.id },
      data: {
        failedSignInCount: 0,
        lockedUntil: null,
        ...(input.reset2fa ? { twoFactorEnabled: false } : {}),
      },
    }),
    input.reset2fa
      ? db.twoFactor.deleteMany({ where: { userId: user.id } })
      : db.twoFactor.updateMany({
          where: { userId: user.id },
          data: { failedVerificationCount: 0, lockedUntil: null },
        }),
  ]);
  return true;
}
