import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { testPrisma } from "@/lib/db/test-client";
import { fetchMediaSlots, resolveSlot } from "./read-core";
import { MEDIA_SLOTS } from "./slots";

// Page-slot images against a real Postgres (Phase 28 spec, D7, D8), as rhm_app, the runtime
// role: it reads, saves and removes a slot's row, and the partial unique index allows one image
// per page slot while other owners keep many rows.

const app = testPrisma("app");
const SLOT = "home.hero";
const OTHER_OWNER = "db-test-gallery";

async function clear() {
  await app.mediaItem.deleteMany({ where: { ownerId: { in: [SLOT, OTHER_OWNER] } } });
}

beforeEach(clear);

afterAll(async () => {
  await clear();
  await app.$disconnect();
});

function pageImage(publicId: string, alt: string) {
  return {
    ownerType: "PAGE" as const,
    ownerId: SLOT,
    kind: "IMAGE" as const,
    cloudinaryId: publicId,
    alt,
  };
}

describe("MediaItem page slots as rhm_app", () => {
  it("shows the default with no row, the saved image with one, and the default after a remove", async () => {
    expect(resolveSlot(SLOT, await fetchMediaSlots(app))).toEqual(MEDIA_SLOTS[SLOT].default);

    const row = await app.mediaItem.create({
      data: pageImage("rhm/page/home-hero/local/first", "First upload"),
    });
    expect(resolveSlot(SLOT, await fetchMediaSlots(app))).toEqual({
      publicId: "rhm/page/home-hero/local/first",
      alt: "First upload",
    });

    await app.mediaItem.delete({ where: { id: row.id } });
    expect(resolveSlot(SLOT, await fetchMediaSlots(app))).toEqual(MEDIA_SLOTS[SLOT].default);
  });

  it("refuses a second image in the same page slot", async () => {
    await app.mediaItem.create({ data: pageImage("rhm/page/home-hero/local/first", "First") });
    await expect(
      app.mediaItem.create({ data: pageImage("rhm/page/home-hero/local/second", "Second") }),
    ).rejects.toThrow();
  });

  it("lets a replace swap the row inside one transaction", async () => {
    const old = await app.mediaItem.create({
      data: pageImage("rhm/page/home-hero/local/first", "First"),
    });
    await app.$transaction([
      app.mediaItem.delete({ where: { id: old.id } }),
      app.mediaItem.create({ data: pageImage("rhm/page/home-hero/local/second", "Second") }),
    ]);
    expect((await fetchMediaSlots(app))[SLOT]).toEqual({
      publicId: "rhm/page/home-hero/local/second",
      alt: "Second",
    });
  });

  it("keeps many rows for an owner that isn't a page slot", async () => {
    for (const sortOrder of [0, 1]) {
      await app.mediaItem.create({
        data: {
          ownerType: "PORTFOLIO_ITEM",
          ownerId: OTHER_OWNER,
          kind: "IMAGE",
          cloudinaryId: `rhm/portfolio_item/${OTHER_OWNER}/${sortOrder}`,
          alt: "Gallery image",
          sortOrder,
        },
      });
    }
    expect(await app.mediaItem.count({ where: { ownerId: OTHER_OWNER } })).toBe(2);
    expect(Object.hasOwn(await fetchMediaSlots(app), OTHER_OWNER)).toBe(false);
  });
});
