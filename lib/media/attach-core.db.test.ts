import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeStaff } from "@/lib/auth/testing/fakes";
import { testPrisma } from "@/lib/db/test-client";
import { createRateLimiter, hashKey } from "@/lib/security/rate-limit-core";
import { attachMediaCore, removeMediaCore, type MediaDeps } from "./attach-core";
import { fetchMediaSlots, resolveSlot } from "./read-core";
import { MAX_UPLOAD_BYTES, mediaErrors } from "./sign-core";
import { MEDIA_SLOTS } from "./slots";

// attachMedia's and removeMedia's writes against a real Postgres, as rhm_app (Phase 28 spec,
// D7, D9, D10): one row per slot, the AuditEvent in the same transaction, the shared rate limit
// and the destroy rule, with a fake Cloudinary client (D13). The guard is the real decision fed
// a fake session; rhm_app can't delete audit rows (Phase 25, D6), so cleanup runs as rhm_migrator.

const SALT = "test-salt-".padEnd(32, "x");
const app = testPrisma("app");
const migrator = testPrisma("migrator");
const SLOT = "home.hero";
const DEFAULT = MEDIA_SLOTS[SLOT].default;
const upload = (name: string) => `rhm/page/home-hero/preview/${name}`;
const userIds: string[] = [];

/** An editor with a fresh id, so each test has its own rate-limit allowance. */
async function editor() {
  const userId = `test-media-${randomUUID().slice(0, 8)}`;
  userIds.push(userId);
  const guard = await fakeStaff("editor", { session: { userId } }).requireRole("editor");
  if (!guard.ok) throw new Error("expected an editor");
  return guard;
}

function deps(overrides: Partial<MediaDeps> = {}) {
  const cloudinary = {
    resource: vi.fn(async () => ({ resource_type: "image", format: "jpg", bytes: 2_000_000 })),
    destroy: vi.fn(async () => ({ result: "ok" })),
  };
  const refresh = vi.fn();
  const d: MediaDeps = {
    db: app,
    rateLimit: createRateLimiter(app, SALT),
    cloudinary,
    env: "preview",
    refresh,
    ...overrides,
  };
  return { cloudinary, refresh, d };
}

const rows = () =>
  app.mediaItem.findMany({
    where: { ownerType: "PAGE", ownerId: SLOT },
    select: { cloudinaryId: true, alt: true, kind: true },
  });

const events = (actorId: string) =>
  app.auditEvent.findMany({
    where: { actorId, entityType: "MediaItem" },
    orderBy: { createdAt: "asc" },
    select: { action: true, entityId: true, diff: true },
  });

async function seedRow(publicId: string, alt = "Seeded") {
  await app.mediaItem.create({
    data: { ownerType: "PAGE", ownerId: SLOT, kind: "IMAGE", cloudinaryId: publicId, alt },
  });
}

beforeEach(async () => {
  await app.mediaItem.deleteMany({ where: { ownerType: "PAGE", ownerId: SLOT } });
});

afterAll(async () => {
  await app.mediaItem.deleteMany({ where: { ownerType: "PAGE", ownerId: SLOT } });
  await migrator.auditEvent.deleteMany({ where: { actorId: { in: userIds } } });
  await app.rateLimitHit.deleteMany({
    where: { bucket: "media", keyHash: { in: userIds.map((id) => hashKey(SALT, id)) } },
  });
  await Promise.all([app.$disconnect(), migrator.$disconnect()]);
});

describe("attachMediaCore and removeMediaCore (Postgres)", () => {
  it("replaces the image twice, keeping one row and destroying only the first upload", async () => {
    const guard = await editor();
    const { cloudinary, refresh, d } = deps();
    const first = { publicId: upload("first"), alt: "First upload" };
    const second = { publicId: upload("second"), alt: "Second upload" };

    expect(await attachMediaCore(guard, SLOT, first.publicId, ` ${first.alt} `, d)).toEqual({
      ok: true,
    });
    // The default is never destroyed.
    expect(cloudinary.destroy).not.toHaveBeenCalled();
    expect(await attachMediaCore(guard, SLOT, second.publicId, second.alt, d)).toEqual({
      ok: true,
    });
    expect(cloudinary.destroy).toHaveBeenCalledExactlyOnceWith(first.publicId);

    expect(await rows()).toEqual([
      { cloudinaryId: second.publicId, alt: second.alt, kind: "IMAGE" },
    ]);
    expect(resolveSlot(SLOT, await fetchMediaSlots(app))).toEqual(second);
    expect(await events(guard.staff.userId)).toEqual([
      { action: "media.replace", entityId: SLOT, diff: { before: DEFAULT, after: first } },
      { action: "media.replace", entityId: SLOT, diff: { before: first, after: second } },
    ]);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("saves new alt text alone without calling Cloudinary", async () => {
    const guard = await editor();
    const { cloudinary, d } = deps();
    const publicId = upload("alt-only");
    await attachMediaCore(guard, SLOT, publicId, "Before", d);
    cloudinary.resource.mockClear();

    expect(await attachMediaCore(guard, SLOT, publicId, "After", d)).toEqual({ ok: true });
    expect(cloudinary.resource).not.toHaveBeenCalled();
    expect(cloudinary.destroy).not.toHaveBeenCalled();
    expect(await rows()).toEqual([{ cloudinaryId: publicId, alt: "After", kind: "IMAGE" }]);
    expect((await events(guard.staff.userId)).at(-1)).toEqual({
      action: "media.alt",
      entityId: SLOT,
      diff: { before: { publicId, alt: "Before" }, after: { publicId, alt: "After" } },
    });
  });

  it("removes the upload, so the default shows, and destroys it", async () => {
    const guard = await editor();
    const { cloudinary, refresh, d } = deps();
    const saved = { publicId: upload("to-remove"), alt: "To remove" };
    await attachMediaCore(guard, SLOT, saved.publicId, saved.alt, d);

    expect(await removeMediaCore(guard, SLOT, d)).toEqual({ ok: true });
    expect(await rows()).toEqual([]);
    expect(resolveSlot(SLOT, await fetchMediaSlots(app))).toEqual(DEFAULT);
    expect(cloudinary.destroy).toHaveBeenCalledExactlyOnceWith(saved.publicId);
    expect((await events(guard.staff.userId)).at(-1)).toEqual({
      action: "media.remove",
      entityId: SLOT,
      diff: { before: saved, after: DEFAULT },
    });

    // A second remove finds nothing to do.
    refresh.mockClear();
    expect(await removeMediaCore(guard, SLOT, d)).toEqual({ ok: true });
    expect(refresh).not.toHaveBeenCalled();
    expect(await events(guard.staff.userId)).toHaveLength(2);
  });

  it.each([
    ["the owner's default", "rhm/page/home-hero/default"],
    ["a seed asset", "rhm/page/dev-media/sample"],
    ["production's upload, in a preview branched from it", "rhm/page/home-hero/production/abc"],
  ])("never destroys %s", async (_name, publicId) => {
    await seedRow(publicId);
    const guard = await editor();
    const { cloudinary, d } = deps();
    expect(await attachMediaCore(guard, SLOT, upload("replacement"), "Replacement", d)).toEqual({
      ok: true,
    });
    expect(await removeMediaCore(guard, SLOT, d)).toEqual({ ok: true });
    // Only this preview's own upload was destroyed, by the remove.
    expect(cloudinary.destroy.mock.calls).toEqual([[upload("replacement")]]);
  });

  it("destroys and refuses an oversized or wrong-format upload, writing nothing", async () => {
    const guard = await editor();
    for (const resource of [
      { resource_type: "image", format: "jpg", bytes: MAX_UPLOAD_BYTES + 1 },
      { resource_type: "image", format: "heic", bytes: 1000 },
    ]) {
      const { cloudinary, refresh, d } = deps();
      cloudinary.resource.mockResolvedValue(resource);
      expect(await attachMediaCore(guard, SLOT, upload("bad"), "Bad", d)).toEqual({
        ok: false,
        error: mediaErrors.badFile,
      });
      expect(cloudinary.destroy).toHaveBeenCalledExactlyOnceWith(upload("bad"));
      expect(refresh).not.toHaveBeenCalled();
    }
    expect(await rows()).toEqual([]);
    expect(await events(guard.staff.userId)).toEqual([]);
  });

  it("logs a failed destroy and keeps the save", async () => {
    const guard = await editor();
    const { cloudinary, d } = deps();
    await attachMediaCore(guard, SLOT, upload("old"), "Old", d);
    cloudinary.destroy.mockRejectedValue({ error: { message: "timeout", http_code: 500 } });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await attachMediaCore(guard, SLOT, upload("new"), "New", d)).toEqual({ ok: true });
    expect(spy).toHaveBeenCalledWith(`[media] destroy failed ${upload("old")}: timeout`);
    spy.mockRestore();
    expect(await rows()).toEqual([{ cloudinaryId: upload("new"), alt: "New", kind: "IMAGE" }]);
  });

  it.each([
    ["signed out", null, {}],
    ["sales", "sales", {}],
    ["an editor without 2FA", "editor", { session: { twoFactorEnabled: false } }],
  ] as const)("refuses %s, writing nothing", async (_name, role, options) => {
    const guard = await fakeStaff(role, options).requireRole("editor");
    expect(guard).toMatchObject({ ok: false, status: role === null ? 401 : 403 });
    const { cloudinary, d } = deps();
    expect(await attachMediaCore(guard, SLOT, upload("x"), "Alt", d)).toEqual({
      ok: false,
      error: mediaErrors.refused,
    });
    expect(await removeMediaCore(guard, SLOT, d)).toEqual({
      ok: false,
      error: mediaErrors.refused,
    });
    expect(cloudinary.resource).not.toHaveBeenCalled();
    expect(await rows()).toEqual([]);
  });

  it("refuses the 31st media action in 10 minutes (D9)", async () => {
    const guard = await editor();
    const { cloudinary, d } = deps();
    // Refused for their alt text, after being counted: 30 actions that write nothing.
    for (let i = 0; i < 30; i++)
      expect((await attachMediaCore(guard, SLOT, upload("x"), "", d)).ok).toBe(false);
    expect(await attachMediaCore(guard, SLOT, upload("x"), "Over the limit", d)).toEqual({
      ok: false,
      error: mediaErrors.rateLimited,
    });
    expect(await removeMediaCore(guard, SLOT, d)).toEqual({
      ok: false,
      error: mediaErrors.rateLimited,
    });
    expect(cloudinary.resource).not.toHaveBeenCalled();
    expect(await rows()).toEqual([]);
  });

  it("rolls the change back, and destroys nothing, when its AuditEvent can't be written", async () => {
    await seedRow(upload("kept"), "Kept");
    const guard = await editor();
    const failingAudit = {
      mediaItem: app.mediaItem,
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
    } as unknown as MediaDeps["db"];
    const { cloudinary, refresh, d } = deps({ db: failingAudit });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await attachMediaCore(guard, SLOT, upload("never"), "Never", d)).toEqual({
      ok: false,
      error: mediaErrors.failed,
    });
    spy.mockRestore();
    expect(await rows()).toEqual([{ cloudinaryId: upload("kept"), alt: "Kept", kind: "IMAGE" }]);
    expect(cloudinary.destroy).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
