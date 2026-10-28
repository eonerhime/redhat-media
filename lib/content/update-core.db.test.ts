import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeStaff } from "@/lib/auth/testing/fakes";
import { testPrisma } from "@/lib/db/test-client";
import { createRateLimiter, hashKey } from "@/lib/security/rate-limit-core";
import { fetchContentBlocks, resolveBlock } from "./read-core";
import { contentErrors, updateContentBlockCore, type UpdateContentDeps } from "./update-core";

// updateContentBlock's writes against a real Postgres, as rhm_app (Phase 27 spec, D5, D7, D8):
// the row, the reset, the AuditEvent in the same transaction, and the rate limit. The guard is
// the real decision fed a fake session (lib/auth/testing/fakes.ts); its own refusals are tested
// in lib/auth. rhm_app can't delete audit rows (Phase 25, D6), so cleanup runs as rhm_migrator.

const SALT = "test-salt-".padEnd(32, "x");
const app = testPrisma("app");
const migrator = testPrisma("migrator");
const KEY = "home.hero.tagline";
const BODY = "about.story.body";
const userIds: string[] = [];

/** An editor with a fresh id, so each test has its own rate-limit allowance. */
async function editor() {
  const userId = `test-content-${randomUUID().slice(0, 8)}`;
  userIds.push(userId);
  return fakeStaff("editor", { session: { userId } }).requireRole("editor");
}

function deps(overrides: Partial<UpdateContentDeps> = {}) {
  const refresh = vi.fn();
  const d: UpdateContentDeps = {
    db: app,
    rateLimit: createRateLimiter(app, SALT),
    refresh,
    ...overrides,
  };
  return { refresh, d };
}

const events = (actorId: string) =>
  app.auditEvent.findMany({
    where: { actorId, entityType: "ContentBlock" },
    orderBy: { createdAt: "asc" },
    select: { action: true, entityId: true, diff: true },
  });

beforeEach(async () => {
  await app.contentBlock.deleteMany({ where: { key: { in: [KEY, BODY] } } });
});

afterAll(async () => {
  await app.contentBlock.deleteMany({ where: { key: { in: [KEY, BODY] } } });
  await migrator.auditEvent.deleteMany({ where: { actorId: { in: userIds } } });
  await app.rateLimitHit.deleteMany({
    where: { bucket: "content", keyHash: { in: userIds.map((id) => hashKey(SALT, id)) } },
  });
  await Promise.all([app.$disconnect(), migrator.$disconnect()]);
});

describe("updateContentBlockCore (Postgres)", () => {
  it("saves, updates and resets a block, auditing each change with before and after", async () => {
    const guard = await editor();
    if (!guard.ok) throw new Error("expected an editor");
    const fallback = resolveBlock(KEY, null);
    const { refresh, d } = deps();

    expect(await updateContentBlockCore(guard, KEY, "  First edit. ", d)).toEqual({
      ok: true,
      value: "First edit.",
    });
    expect(await updateContentBlockCore(guard, KEY, "Second edit.", d)).toEqual({
      ok: true,
      value: "Second edit.",
    });
    const row = await app.contentBlock.findUnique({ where: { key: KEY } });
    expect(row).toMatchObject({ value: "Second edit.", updatedById: guard.staff.userId });
    expect(resolveBlock(KEY, await fetchContentBlocks(app))).toBe("Second edit.");

    expect(await updateContentBlockCore(guard, KEY, "", d)).toEqual({ ok: true, value: fallback });
    expect(await app.contentBlock.findUnique({ where: { key: KEY } })).toBeNull();
    expect(resolveBlock(KEY, await fetchContentBlocks(app))).toBe(fallback);

    expect(await events(guard.staff.userId)).toEqual([
      { action: "content.update", entityId: KEY, diff: { before: fallback, after: "First edit." } },
      {
        action: "content.update",
        entityId: KEY,
        diff: { before: "First edit.", after: "Second edit." },
      },
      { action: "content.reset", entityId: KEY, diff: { before: "Second edit.", after: fallback } },
    ]);
    expect(refresh).toHaveBeenCalledTimes(3);
  });

  it("writes nothing for an unchanged value, an empty value with no row, or the default text", async () => {
    const guard = await editor();
    if (!guard.ok) throw new Error("expected an editor");
    const fallback = resolveBlock(KEY, null);
    const { refresh, d } = deps();

    expect(await updateContentBlockCore(guard, KEY, "", d)).toEqual({ ok: true, value: fallback });
    expect(await updateContentBlockCore(guard, KEY, fallback, d)).toEqual({
      ok: true,
      value: fallback,
    });
    await updateContentBlockCore(guard, KEY, "Edited.", d);
    await updateContentBlockCore(guard, KEY, "Edited.", d);
    // Typing the default back resets the block: no row repeats a default.
    expect(await updateContentBlockCore(guard, KEY, fallback, d)).toEqual({
      ok: true,
      value: fallback,
    });
    expect(await app.contentBlock.findUnique({ where: { key: KEY } })).toBeNull();
    expect((await events(guard.staff.userId)).map((e) => e.action)).toEqual([
      "content.update",
      "content.reset",
    ]);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("keeps a body block's paragraphs and bold markers", async () => {
    const guard = await editor();
    if (!guard.ok) throw new Error("expected an editor");
    const { d } = deps();
    const value = "We **build** it.\nThen we ship it.";
    expect(await updateContentBlockCore(guard, BODY, value, d)).toEqual({ ok: true, value });
    expect(resolveBlock(BODY, await fetchContentBlocks(app))).toBe(value);
  });

  it("refuses sales staff and a signed-out visitor, writing nothing", async () => {
    const { refresh, d } = deps();
    for (const role of ["sales", null] as const) {
      const guard = await fakeStaff(role).requireRole("editor");
      expect(await updateContentBlockCore(guard, KEY, "Not allowed.", d)).toEqual({
        ok: false,
        error: contentErrors.refused,
      });
    }
    expect(await app.contentBlock.findUnique({ where: { key: KEY } })).toBeNull();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("refuses the 61st save in 10 minutes and writes nothing (D8)", async () => {
    const guard = await editor();
    if (!guard.ok) throw new Error("expected an editor");
    const { d } = deps();
    // Refused for length, after being counted: 60 saves that write nothing.
    for (let i = 0; i < 60; i++)
      expect((await updateContentBlockCore(guard, KEY, "a".repeat(121), d)).ok).toBe(false);
    expect(await updateContentBlockCore(guard, KEY, "Over the limit.", d)).toEqual({
      ok: false,
      error: contentErrors.rateLimited,
    });
    expect(await app.contentBlock.findUnique({ where: { key: KEY } })).toBeNull();
  });

  it("rolls the change back when its AuditEvent can't be written", async () => {
    const guard = await editor();
    if (!guard.ok) throw new Error("expected an editor");
    const failingAudit = {
      $transaction: (fn: (tx: unknown) => Promise<unknown>) =>
        app.$transaction((tx) =>
          fn(
            new Proxy(tx, {
              get: (target, prop, receiver) =>
                prop === "auditEvent"
                  ? {
                      create: async () => {
                        throw new Error("audit down");
                      },
                    }
                  : Reflect.get(target, prop, receiver),
            }),
          ),
        ),
    } as unknown as UpdateContentDeps["db"];
    const { refresh, d } = deps({ db: failingAudit });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await updateContentBlockCore(guard, KEY, "Never saved.", d)).toEqual({
      ok: false,
      error: contentErrors.failed,
    });
    spy.mockRestore();
    expect(await app.contentBlock.findUnique({ where: { key: KEY } })).toBeNull();
    expect(refresh).not.toHaveBeenCalled();
  });
});
