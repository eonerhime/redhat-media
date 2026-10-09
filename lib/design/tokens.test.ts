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

  it.each(tokenPairings)("$fg on $bg meets $min:1 ($use)", ({ fg, bg, min }) => {
    const ratio = contrastRatio(colors.get(fg)!, colors.get(bg)!);
    expect(ratio).toBeGreaterThanOrEqual(min);
  });
});
