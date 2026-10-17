import { describe, expect, it } from "vitest";
import { contrastRatio, isLargeText, parseColor, requiredTextRatio } from "./contrast";

describe("parseColor", () => {
  it("parses hex and rgb() forms", () => {
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor("#ED1C24")).toEqual({ r: 237, g: 28, b: 36, a: 1 });
    expect(parseColor("rgb(26, 26, 26)")).toEqual({ r: 26, g: 26, b: 26, a: 1 });
    expect(parseColor("rgba(0, 0, 0, 0.5)")).toEqual({ r: 0, g: 0, b: 0, a: 0.5 });
    expect(parseColor("rgb(0 0 0 / 50%)")).toEqual({ r: 0, g: 0, b: 0, a: 0.5 });
  });

  it("rejects colours it cannot evaluate", () => {
    expect(() => parseColor("oklch(0.6 0.2 25)")).toThrow(/Unsupported colour/);
    expect(() => parseColor("red")).toThrow(/Unsupported colour/);
  });
});

describe("contrastRatio", () => {
  it("matches known WCAG values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrastRatio("#ed1c24", "#1a1a1a")).toBeCloseTo(3.97, 2);
    expect(contrastRatio("#808285", "#1a1a1a")).toBeCloseTo(4.52, 2);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#1a1a1a", "#f5f5f5")).toBeCloseTo(
      contrastRatio("#f5f5f5", "#1a1a1a"),
      10,
    );
  });

  it("blends a translucent foreground over the background", () => {
    expect(contrastRatio("rgba(255, 255, 255, 0)", "#1a1a1a")).toBeCloseTo(1, 5);
  });

  it("requires an opaque background", () => {
    expect(() => contrastRatio("#fff", "rgba(0, 0, 0, 0.5)")).toThrow(/opaque/);
  });
});

describe("large text thresholds", () => {
  it("treats ≥ 24px, or ≥ 18.66px bold, as large", () => {
    expect(isLargeText(24, 400)).toBe(true);
    expect(isLargeText(18.66, 700)).toBe(true);
    expect(isLargeText(18.66, 600)).toBe(false);
    expect(isLargeText(16, 900)).toBe(false);
    expect(requiredTextRatio(16, 400)).toBe(4.5);
    expect(requiredTextRatio(32, 400)).toBe(3);
  });
});
