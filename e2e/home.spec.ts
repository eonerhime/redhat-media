import { expect, type Page } from "@playwright/test";
import { defaults } from "../content/defaults";
import { pillars, services } from "../content/services";
import { expectOnlyKeyedText } from "./keyed-text";
import { cardTexts, expectedFeatured, portfolioState, test } from "./portfolio-expect";

// `test` from portfolio-expect sends the bypass header on a protected preview, where the
// featured-work cases run against the seeded preview branch (Phase 23 spec, plan 2.5).

test.describe("homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has the sections in roadmap order", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByRole("heading", { level: 1 })).toHaveText(defaults["home.hero.tagline"]);
    await expect(main.getByRole("heading", { level: 2 })).toHaveText([
      defaults["home.services.heading"],
      defaults["home.work.heading"],
      defaults["home.process.heading"],
      defaults["home.cta.heading"],
    ]);
  });

  test("shows one card per pillar, linking every service to its page", async ({ page }) => {
    // Scoped to its section: the featured portfolio cards are articles too (Phase 23).
    const cards = page
      .getByRole("region", { name: defaults["home.services.heading"], exact: true })
      .locator("article");
    await expect(cards.getByRole("heading", { level: 3 })).toHaveText(
      pillars.map((p) => defaults[p.nameKey]),
    );
    for (const s of services) {
      await expect(
        cards.getByRole("link", { name: defaults[s.nameKey], exact: true }),
      ).toHaveAttribute("href", `/services/${s.slug}`);
    }
  });

  test("sends both CTAs to /contact", async ({ page }) => {
    const ctas = page.locator("main").getByRole("link", { name: defaults["home.cta.button"] });
    await expect(ctas).toHaveCount(2);
    for (const cta of await ctas.all()) await expect(cta).toHaveAttribute("href", "/contact");
  });

  test("uses the ported meta description", async ({ page }) => {
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      defaults["home.meta.description"],
    );
  });

  // Roadmap "Done when": every text string is keyed (Phase 3 spec, D8). Featured cards show
  // database content (Phase 23 spec, D1).
  test("renders only text from content/defaults.ts in <main>", async ({ page }) => {
    await expectOnlyKeyedText(page, cardTexts);
  });
});

test.describe("homepage featured work (Phase 23 spec, D1-D4)", () => {
  const section = (page: Page) =>
    page.getByRole("region", { name: defaults["home.work.heading"], exact: true });

  test("shows the featured items in portfolio order, or only the text and link", async ({
    page,
  }) => {
    const expected = expectedFeatured(await portfolioState(page));
    await page.goto("/");
    const work = section(page);
    // The body says "will appear here" only when no card is shown (owner, 2026-10-24).
    const body = expected.length > 0 ? "home.work.bodyLive" : "home.work.body";
    await expect(work.getByText(defaults[body], { exact: true })).toBeVisible();
    await expect(
      work.getByRole("link", { name: defaults["home.work.link"], exact: true }),
    ).toHaveAttribute("href", "/portfolio");
    await expect(work.getByRole("heading", { level: 3 })).toHaveText(
      expected.map((card) => card.title),
    );
    for (const card of expected)
      await expect(work.getByRole("link", { name: card.title, exact: true })).toHaveAttribute(
        "href",
        `/portfolio/${card.slug}`,
      );
    // D2: no unavailable or empty message, whatever the read returned.
    await expect(work.getByRole("status")).toHaveCount(0);
  });

  test("a card opens the full page, not the portfolio dialog (D4)", async ({ page }) => {
    const [first] = expectedFeatured(await portfolioState(page));
    test.skip(!first, "needs featured items");
    await page.goto("/");
    await section(page).getByRole("link", { name: first!.title, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/portfolio/${first!.slug}$`));
    await expect(page.getByTestId("portfolio-detail")).toBeVisible();
    await expect(page.locator('dialog[data-testid="portfolio-modal"][open]')).toHaveCount(0);
  });
});
