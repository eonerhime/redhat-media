import { describe, expect, it } from "vitest";
import { defaults } from "../../content/defaults";
import { resolveBlock, type BlockKey } from "./read-core";

// The pure half of block() (Phase 27 spec, D6): a saved value wins, the default fills the rest.

describe("resolveBlock()", () => {
  it("returns the default when the key has no row", () => {
    expect(resolveBlock("home.hero.tagline", {})).toBe(defaults["home.hero.tagline"]);
  });

  it("returns the saved value when the key has a row", () => {
    expect(resolveBlock("home.hero.tagline", { "home.hero.tagline": "Edited." })).toBe("Edited.");
  });

  it("leaves other keys on their defaults", () => {
    const overrides = { "home.hero.tagline": "Edited." };
    expect(resolveBlock("home.hero.subtext", overrides)).toBe(defaults["home.hero.subtext"]);
  });

  it("shows every default after a failed read", () => {
    for (const key of Object.keys(defaults) as BlockKey[]) {
      expect(resolveBlock(key, null)).toBe(defaults[key]);
    }
  });

  it("throws on an unknown key, even when a row has it", () => {
    const stray = { "home.hero.removed": "Left over." };
    expect(() => resolveBlock("home.hero.removed" as BlockKey, stray)).toThrow(
      /Unknown content block key/,
    );
    expect(() => resolveBlock("toString" as BlockKey, {})).toThrow(/Unknown content block key/);
  });

  it("ignores inherited properties of the overrides object", () => {
    expect(resolveBlock("home.hero.tagline", Object.create({ "home.hero.tagline": "x" }))).toBe(
      defaults["home.hero.tagline"],
    );
  });
});
