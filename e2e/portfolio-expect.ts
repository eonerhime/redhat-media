import { test as base, expect, type Page } from "@playwright/test";
import type { ServiceCategory } from "../content/services";
import { featuredCards, relatedTo, type PortfolioCard } from "../lib/portfolio/read-core";
import { portfolioSeed } from "../prisma/seed-data/portfolio";

// What the portfolio pages should show, from the seed content (Phase 10 spec, D10, D11).

export type PortfolioState = "ready" | "empty" | "unavailable";

/** CI pins `unavailable` (no database); the preview run pins `ready`; locally it is read off the page. */
export const pinnedState = ((): PortfolioState | undefined => {
  const value = process.env.E2E_PORTFOLIO_STATE;
  if (value === undefined || value === "") return undefined;
  if (value === "ready" || value === "empty" || value === "unavailable") return value;
  throw new Error(`E2E_PORTFOLIO_STATE must be ready, empty or unavailable, got: ${value}`);
})();

/** The seeded items as cards, in display order (every seeded item is published). */
export const seedCards: PortfolioCard[] = portfolioSeed.map((item) => ({
  id: `seed_${item.slug.replace(/-/g, "_")}`,
  slug: item.slug,
  title: item.title,
  category: item.category,
  summary: item.summary,
  techStack: [...item.techStack],
  liveUrl: new URL(item.liveUrl).href,
  featured: item.featured,
  cover: { publicId: "", alt: item.cover.alt },
}));

/** Text a card may show besides content keys: database content and ExternalLink's hint. */
export const cardTexts: readonly string[] = [
  ...seedCards.flatMap((card) => [card.title, card.summary, ...card.techStack]),
  "(opens in a new tab)",
];

/** The related-work titles a service page should show in this state (D8). */
export function expectedRelated(category: ServiceCategory, state: PortfolioState): string[] {
  return state === "ready" ? relatedTo(seedCards, category).map((card) => card.title) : [];
}

/** The homepage's featured titles in this state (Phase 23 spec, D1, D2). */
export function expectedFeatured(state: PortfolioState): PortfolioCard[] {
  return state === "ready" ? featuredCards(seedCards) : [];
}

/** Reads the listing state off /portfolio, and checks it against the pinned one. */
export async function portfolioState(page: Page): Promise<PortfolioState> {
  await page.goto("/portfolio");
  const state = (await page
    .getByTestId("portfolio-listing")
    .getAttribute("data-state")) as PortfolioState;
  if (pinnedState) expect(state, "E2E_PORTFOLIO_STATE").toBe(pinnedState);
  return state;
}

// On a protected Vercel preview (PW_BASE_URL), the bypass header goes to the preview's own origin
// only, never to Cloudinary or any other host (Phase 10 spec, C6).
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const remote = process.env.PW_BASE_URL;

export const test = base.extend({
  page: async ({ page }, provide) => {
    if (remote && bypass) {
      const origin = new URL(remote).origin;
      await page.route(
        (url) => url.origin === origin,
        (route) =>
          route.continue({
            headers: { ...route.request().headers(), "x-vercel-protection-bypass": bypass },
          }),
      );
    }
    await provide(page);
  },
});
