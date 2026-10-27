// The lockout's database side (Phase 24 spec, D4). It takes its client as an
// argument, so the database tests run it as rhm_app on a throwaway Postgres.

import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { LockoutStore } from "./lockout";
import { LOCKOUT_MAX_FAILURES } from "./options";

export function createLockoutStore(
  db: Pick<PrismaClient, "user" | "session" | "twoFactor">,
): LockoutStore {
  return {
    async find(email) {
      const user = await db.user.findUnique({
        where: { email },
        select: {
          id: true,
          lockedUntil: true,
          deactivatedAt: true,
          twofactors: { select: { lockedUntil: true } },
        },
      });
      if (!user) return null;
      const twoFactorLocks = user.twofactors
        .map((row) => row.lockedUntil?.getTime())
        .filter((time): time is number => time !== undefined);
      return {
        userId: user.id,
        lockedUntil: user.lockedUntil,
        deactivatedAt: user.deactivatedAt,
        twoFactorLockedUntil: twoFactorLocks.length ? new Date(Math.max(...twoFactorLocks)) : null,
      };
    },

    async recordFailure(email, until) {
      // An atomic increment (UPDATE … SET n = n + 1), so parallel failures cannot lose a count.
      const [user] = await db.user.updateManyAndReturn({
        where: { email },
        data: { failedSignInCount: { increment: 1 } },
        select: { id: true, failedSignInCount: true },
      });
      if (!user) return null;
      if (user.failedSignInCount < LOCKOUT_MAX_FAILURES) return { userId: user.id, locked: false };
      // Lock and start counting again. The count condition lets only one of several
      // parallel requests do it.
      const { count } = await db.user.updateMany({
        where: { id: user.id, failedSignInCount: { gte: LOCKOUT_MAX_FAILURES } },
        data: { failedSignInCount: 0, lockedUntil: until },
      });
      return { userId: user.id, locked: count === 1 };
    },

    async endOtherSessions(userId, keepToken) {
      await db.session.deleteMany({ where: { userId, token: { not: keepToken } } });
    },

    async twoFactorLocked(userId, now) {
      const locked = await db.twoFactor.findFirst({
        where: {
          userId,
          lockedUntil: { gt: now },
          failedVerificationCount: { gte: LOCKOUT_MAX_FAILURES },
        },
        select: { id: true },
      });
      return locked !== null;
    },

    async reset(email) {
      await db.user.updateMany({
        where: { email, failedSignInCount: { gt: 0 } },
        data: { failedSignInCount: 0 },
      });
    },
  };
}
