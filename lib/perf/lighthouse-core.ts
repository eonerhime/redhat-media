// The pure part of scripts/lighthouse.mts (Phase 15 spec, D6, amended): which pages are measured,
// how three runs become one score, and the ≥ 0.90 budget (tech-stack.md → Architectural rules 11).

/** One page per template. The 404 view is left out: Lighthouse refuses to score a page that
 * answers 4xx (ERRORED_DOCUMENT_REQUEST), and that view is only the shell every page here has.
 * Axe and not-found.spec.ts cover it. */
export const lighthousePaths = [
  "/",
  "/services",
  "/services/photography",
  "/about",
  "/portfolio",
  "/portfolio/sportspred",
  "/contact",
] as const;

/** The staff login, measured only where the CMS is on (LIGHTHOUSE_CMS=on; Phase 24 spec, D18). */
export const staffLighthousePaths = ["/cms/login"] as const;

export const categories = ["performance", "accessibility", "best-practices", "seo"] as const;
export type Category = (typeof categories)[number];
export type Scores = Record<Category, number>;

/** The pages to measure: the public templates, then the staff login when the CMS is on. */
export function pathsToMeasure(cmsOn: boolean): readonly string[] {
  return cmsOn ? [...lighthousePaths, ...staffLighthousePaths] : lighthousePaths;
}

/** The categories held to the budget. A staff page is noindex, so only accessibility and best
 * practices count there (D18); its other scores are still printed. */
export function budgetCategories(path: string): readonly Category[] {
  return (staffLighthousePaths as readonly string[]).includes(path)
    ? ["accessibility", "best-practices"]
    : categories;
}

export const budget = 0.9;
export const runsPerPage = 3;

/** The middle value; for an even count, the lower of the two middle values (the stricter one). */
export function median(values: readonly number[]): number {
  if (values.length === 0) throw new Error("median of no values");
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)]!;
}

/** Per-category medians over the runs of one page. */
export function medianScores(runs: readonly Scores[]): Scores {
  return Object.fromEntries(
    categories.map((c) => [c, median(runs.map((run) => run[c]))]),
  ) as Scores;
}

/** "path category score" for every median below the budget. */
export function budgetFailures(results: Readonly<Record<string, Scores>>): string[] {
  return Object.entries(results).flatMap(([path, scores]) =>
    budgetCategories(path)
      .filter((c) => scores[c] < budget)
      .map((c) => `${path} ${c} ${scores[c]}`),
  );
}

/** The `_vercel_jwt` cookie from a bypass response's Set-Cookie headers, or undefined. */
export function bypassCookie(
  setCookies: readonly string[],
): { name: string; value: string } | undefined {
  for (const header of setCookies) {
    const match = /^(_vercel_jwt)=([^;]+)/.exec(header.trim());
    if (match) return { name: match[1]!, value: match[2]! };
  }
  return undefined;
}
