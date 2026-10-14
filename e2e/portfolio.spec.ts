import { expect, type Page } from "@playwright/test";
import { defaults } from "../content/defaults";
import { services } from "../content/services";
import { resolveVisibility } from "../lib/content/services";
import { siteName } from "../lib/site";
import { expectOnlyKeyedText } from "./keyed-text";
import { cardTexts, expectedRelated, portfolioState, seedCards, test } from "./portfolio-expect";

// Phase 10 "Done when": all seeded items are listed, with loading, error and empty states
// (Phase 10 spec, D10, D11). Each run checks the state its build produced: CI has no database
// (unavailable), the Vercel preview has the seeded preview branch (ready).

const listing = (page: Page) => page.getByTestId("portfolio-listing");
const cards = (page: Page) => listing(page).getByRole("article");

test.describe("/portfolio", () => {
  test("has its title, description, heading and the current nav item", async ({ page }) => {
    await portfolioState(page);
    await expect(page).toHaveTitle(`Portfolio | ${siteName}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      defaults["portfolio.meta.description"],
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(defaults["portfolio.heading"]);
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Portfolio" }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("lists every seeded item in order, or says plainly why not", async ({ page }) => {
    const state = await portfolioState(page);
    const cta = page.locator("main").getByRole("link", { name: defaults["home.cta.button"] });
    await expect(cta).toHaveAttribute("href", "/contact");

    if (state !== "ready") {
      await expect(cards(page)).toHaveCount(0);
      await expect(listing(page).getByRole("status")).toHaveText(
        defaults[state === "empty" ? "portfolio.empty" : "portfolio.unavailable"],
      );
      return;
    }

    await expect(cards(page)).toHaveCount(seedCards.length);
    await expect(cards(page).getByRole("heading", { level: 2 })).toHaveText(
      seedCards.map((card) => card.title),
    );
    for (const [index, card] of seedCards.entries()) {
      const article = cards(page).nth(index);
      await expect(article).toContainText(card.summary);
      await expect(article).toContainText(defaults["services.webApp.name"]);
      await expect(
        article.getByRole("list", { name: defaults["portfolio.tech"] }).getByRole("listitem"),
      ).toHaveText(card.techStack);

      const live = article.getByRole("link", { name: new RegExp(defaults["portfolio.live"]) });
      await expect(live).toHaveAttribute("href", card.liveUrl!);
      await expect(live).toHaveAttribute("target", "_blank");
      await expect(live).toHaveAttribute("rel", "noopener noreferrer");

      // Lazy covers load once scrolled into view; only the first is preloaded (D4).
      const cover = article.getByRole("img", { name: card.cover!.alt, exact: true });
      await cover.scrollIntoViewIfNeeded();
      await expect
        .poll(() => cover.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
        .toBeGreaterThan(0);
      if (index === 0) {
        await expect(cover).toHaveAttribute("fetchpriority", "high");
        await expect(cover).not.toHaveAttribute("loading", "lazy");
      } else {
        await expect(cover).toHaveAttribute("loading", "lazy");
      }
    }
  });

  test("renders only content keys and seeded content in <main>", async ({ page }) => {
    await portfolioState(page);
    await expectOnlyKeyedText(page, cardTexts);
  });

  test("lifts a card on hover only when motion is allowed (D4)", async ({ page }) => {
    test.skip((await portfolioState(page)) !== "ready", "needs published items");
    const card = cards(page).first();
    // Tailwind 4 moves with the `translate` and `scale` properties, not `transform`.
    const motion = () =>
      card.evaluate((el) => {
        const cover = el.querySelector("img");
        return `${getComputedStyle(el).translate} | ${cover ? getComputedStyle(cover).scale : "none"}`;
      });

    await page.emulateMedia({ reducedMotion: "no-preference" });
    await card.hover();
    await expect.poll(motion).toMatch(/^0px -\d.*\| 1\.04$/);

    await page.mouse.move(0, 0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await card.hover();
    await expect.poll(motion).toBe("none | none");
  });
});

test.describe("related work on service pages (D8)", () => {
  for (const service of resolveVisibility(services)) {
    test(`/services/${service.slug}`, async ({ page }) => {
      const titles = expectedRelated(service.category, await portfolioState(page));
      await page.goto(`/services/${service.slug}`);
      const section = page.getByRole("region", {
        name: defaults["services.detail.work.heading"],
        exact: true,
      });
      if (titles.length === 0) {
        await expect(section).toHaveCount(0);
        return;
      }
      await expect(section.getByRole("heading", { level: 3 })).toHaveText(titles);
      await expect(
        section.getByRole("link", { name: defaults["services.detail.work.link"], exact: true }),
      ).toHaveAttribute("href", "/portfolio");
    });
  }
});

test.describe("/dev/portfolio-states (D10)", () => {
  test("shows the empty and unavailable states", async ({ page }) => {
    await page.goto("/dev/portfolio-states");
    const states = page.getByTestId("portfolio-listing");
    await expect(states).toHaveCount(2);
    await expect(states.nth(0)).toHaveAttribute("data-state", "empty");
    await expect(states.nth(0).getByRole("status")).toHaveText(defaults["portfolio.empty"]);
    await expect(states.nth(1)).toHaveAttribute("data-state", "unavailable");
    await expect(states.nth(1).getByRole("status")).toHaveText(defaults["portfolio.unavailable"]);
  });
});
