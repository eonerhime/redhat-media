import { describe, expect, it } from "vitest";
import { ASPECTS, isRhmPublicId } from "./cloudinary";
import { isMediaSlot, MEDIA_SLOTS, type MediaSlot } from "./slots";

// The slot registry (Phase 28 spec, D2, D4): every default renders through <MediaImage>, and
// every upload folder sits under its owner's rhm/ folder.

const slots = Object.keys(MEDIA_SLOTS) as MediaSlot[];
const OWNER_FOLDER = { PAGE: "rhm/page/" } as const;

describe("MEDIA_SLOTS", () => {
  it.each(slots)("%s has a usable default", (slot) => {
    const { default: image } = MEDIA_SLOTS[slot];
    expect(isRhmPublicId(image.publicId)).toBe(true);
    expect(image.alt.trim()).not.toBe("");
    expect(image.alt.length).toBeLessThanOrEqual(150);
  });

  it.each(slots)("%s uploads under its owner's folder", (slot) => {
    const { owner, folder, aspect } = MEDIA_SLOTS[slot];
    expect(folder.startsWith(OWNER_FOLDER[owner])).toBe(true);
    // The folder plus {env}/{random} must still be a valid public ID.
    expect(isRhmPublicId(`${folder}/preview/abc123`)).toBe(true);
    expect(Object.hasOwn(ASPECTS, aspect)).toBe(true);
  });

  it("never puts a default inside a slot's upload folder, so no default can be destroyed", () => {
    for (const slot of slots) {
      const { folder, default: image } = MEDIA_SLOTS[slot];
      for (const env of ["production", "preview", "local"]) {
        expect(image.publicId.startsWith(`${folder}/${env}/`)).toBe(false);
      }
    }
  });
});

describe("isMediaSlot()", () => {
  it("accepts listed slots only", () => {
    expect(isMediaSlot("home.hero")).toBe(true);
    expect(isMediaSlot("home.missing")).toBe(false);
    expect(isMediaSlot("toString")).toBe(false);
    expect(isMediaSlot(42)).toBe(false);
  });
});
