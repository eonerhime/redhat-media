import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";
import { readThemeColors, tokenPairings } from "./tokens";

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
const colors = readThemeColors(css);

describe("design tokens in app/globals.css", () => {
  it("removes Tailwind's default palette", () => {
    expect(css).toMatch(/--color-\*\s*:\s*initial\s*;/);
  });

  it("defines exactly the token set from tech-stack.md", () => {
    expect([...colors.keys()].sort()).toEqual(
      ["brand", "brand-deep", "fg", "ink", "line", "muted"].sort(),
    );
  });

  // The viewport themeColor cannot read CSS variables, so these files repeat token values
  // as `"#hex", // --color-name` and must stay in sync.
  it.each(["../../app/layout.tsx"])("%s repeats token values exactly", (file) => {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    const copies = [...source.matchAll(/"(#[0-9a-fA-F]{3,6})"[,;]?\s*\/\/\s*--color-([a-z-]+)/g)];
    expect(copies.length).toBeGreaterThan(0);
    for (const [, hex, name] of copies) expect(hex.toLowerCase()).toBe(colors.get(name));
  });

  it.each(tokenPairings)("$fg on $bg meets $min:1 ($use)", ({ fg, bg, min }) => {
    const ratio = contrastRatio(colors.get(fg)!, colors.get(bg)!);
    expect(ratio).toBeGreaterThanOrEqual(min);
  });
});
