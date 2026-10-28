import { describe, expect, it } from "vitest";
import { resolveSlot } from "./read-core";
import { MEDIA_SLOTS, type MediaSlot } from "./slots";

// The pure half of mediaSlot() (Phase 28 spec, D8): a saved image wins, the default fills the
// rest.

const HERO_DEFAULT = MEDIA_SLOTS["home.hero"].default;
const SAVED = { publicId: "rhm/page/home-hero/preview/abc123", alt: "Studio shoot" };

describe("resolveSlot()", () => {
  it("returns the default when the slot has no row", () => {
    expect(resolveSlot("home.hero", {})).toEqual(HERO_DEFAULT);
  });

  it("returns the saved image when the slot has a row", () => {
    expect(resolveSlot("home.hero", { "home.hero": SAVED })).toEqual(SAVED);
  });

  it("shows the default after a failed read", () => {
    expect(resolveSlot("home.hero", null)).toEqual(HERO_DEFAULT);
  });

  it("ignores a saved image outside rhm/, which <MediaImage> would refuse", () => {
    const bad = { publicId: "https://example.com/x.jpg", alt: "x" };
    expect(resolveSlot("home.hero", { "home.hero": bad })).toEqual(HERO_DEFAULT);
  });

  it("throws on an unknown slot", () => {
    expect(() => resolveSlot("home.missing" as MediaSlot, {})).toThrow(/Unknown media slot/);
    expect(() => resolveSlot("toString" as MediaSlot, {})).toThrow(/Unknown media slot/);
  });

  it("ignores inherited properties of the overrides object", () => {
    expect(resolveSlot("home.hero", Object.create({ "home.hero": SAVED }))).toEqual(HERO_DEFAULT);
  });
});
