import { describe, expect, it } from "vitest";
import {
  budgetFailures,
  bypassCookie,
  categories,
  lighthousePaths,
  median,
  medianScores,
  pathsToMeasure,
  type Scores,
} from "./lighthouse-core";

const all = (score: number) => Object.fromEntries(categories.map((c) => [c, score])) as Scores;

// Phase 15 spec, D6 (amended).
describe("lighthouse budget", () => {
  it("measures every public template once, and no 404 page", () => {
    expect(lighthousePaths).toEqual(
      expect.arrayContaining(["/", "/portfolio/sportspred", "/contact"]),
    );
    expect(lighthousePaths).not.toContain("/services/branding");
    expect(new Set(lighthousePaths).size).toBe(lighthousePaths.length);
  });

  it("adds the staff login only where the CMS is on (Phase 24 spec, D18)", () => {
    expect(pathsToMeasure(false)).toEqual(lighthousePaths);
    expect(pathsToMeasure(true)).toEqual([...lighthousePaths, "/admin"]);
  });

  it("holds the staff login to accessibility and best practices only", () => {
    expect(budgetFailures({ "/admin": { ...all(0.95), performance: 0.5, seo: 0.6 } })).toEqual([]);
    expect(budgetFailures({ "/admin": { ...all(0.95), accessibility: 0.89 } })).toEqual([
      "/admin accessibility 0.89",
    ]);
  });

  it("takes the middle of three runs, and the lower middle of an even count", () => {
    expect(median([0.95, 0.7, 0.92])).toBe(0.92);
    expect(median([0.9, 0.8])).toBe(0.8);
    expect(() => median([])).toThrow();
  });

  it("takes the median per category", () => {
    const runs = [all(0.95), { ...all(0.91), performance: 0.5 }, all(0.93)];
    expect(medianScores(runs)).toEqual(all(0.93));
  });

  it("fails any category below 0.90, and passes 0.90 itself", () => {
    expect(budgetFailures({ "/": all(0.9) })).toEqual([]);
    expect(budgetFailures({ "/": { ...all(0.95), seo: 0.89 }, "/about": all(1) })).toEqual([
      "/ seo 0.89",
    ]);
  });
});

describe("bypassCookie()", () => {
  it("finds Vercel's bypass cookie among Set-Cookie headers", () => {
    expect(
      bypassCookie(["other=1; Path=/", "_vercel_jwt=abc.def.ghi; Path=/; Secure; HttpOnly"]),
    ).toEqual({ name: "_vercel_jwt", value: "abc.def.ghi" });
  });

  it("returns undefined when there is none", () => {
    expect(bypassCookie(["other=1"])).toBeUndefined();
  });
});
