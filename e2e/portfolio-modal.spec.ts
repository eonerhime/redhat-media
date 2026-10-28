import { expect, type Page } from "@playwright/test";
import { defaults } from "../content/defaults";
import { serviceByCategory } from "../lib/content/services";
import { notFoundCopy, siteName } from "../lib/site";
import { portfolioSeed } from "../prisma/seed-data/portfolio";
import { contrastFailures } from "./contrast";
import { portfolioState, test } from "./portfolio-expect";

// Phase 22 "Done when": deep links, back/forward and focus trapping (Phase 22 spec, D11). Every
// case needs published cards, so the whole file runs on the seeded Vercel preview (preview-e2e)
// and skips in CI, where the portfolio is unavailable.

const [first, second] = portfolioSeed;
const item = first!;
const itemUrl = new RegExp(`/portfolio/${item.slug}$`);
const portfolioTitle = `Portfolio | ${siteName}`;

// The open one: the router keeps an item it left in a hidden <Activity>, closed, so a second item
// can leave an earlier dialog in the DOM.
const modal = (page: Page) => page.locator('dialog[data-testid="portfolio-modal"][open]');
const cardLink = (page: Page, title = item.title) =>
  page.getByTestId("portfolio-listing").getByRole("link", { name: title, exact: true });
const jsonLd = (page: Page) => page.locator('script[type="application/ld+json"]');
const viewLabel = (alt: string) => defaults["portfolio.detail.view"].replace("{alt}", alt);

/** Opens /portfolio (or a filtered view) and the first item's modal from its card. */
async function openModal(page: Page, from = "/portfolio") {
  await page.goto(from);
  await cardLink(page).click();
  await expect(page).toHaveURL(itemUrl);
  await expect(modal(page)).toBeVisible();
  // The dialog opens on the loading skeleton; on the preview the item streams in after it (D8).
  await expect(modal(page).getByTestId("portfolio-detail")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  test.skip((await portfolioState(page)) !== "ready", "needs published items");
});

test.describe("opening and deep links", () => {
  test("a card opens the item as a modal over the grid", async ({ page }) => {
    await openModal(page);
    await expect(modal(page)).toHaveAccessibleName(item.title);
    await expect(modal(page).getByRole("heading", { level: 1 })).toHaveText(item.title);
    await expect(
      modal(page).getByRole("button", { name: defaults["portfolio.modal.close"] }),
    ).toBeFocused();
    // The grid is still there behind it, and the modal has no "All work" link (D3).
    await expect(page.getByTestId("portfolio-listing")).toHaveCount(1);
    await expect(
      modal(page).getByRole("link", { name: defaults["portfolio.detail.back"] }),
    ).toHaveCount(0);
    await expect(modal(page).locator('script[type="application/ld+json"]')).toHaveCount(0);
    // The tab names the item (D7).
    await expect(page).toHaveTitle(`${item.title} | ${siteName}`);
  });

  test("a direct load shows the full page", async ({ page }) => {
    await page.goto(`/portfolio/${item.slug}`);
    await expect(page.getByTestId("portfolio-detail")).toBeVisible();
    await expect(modal(page)).toHaveCount(0);
    await expect(page.getByRole("link", { name: defaults["portfolio.detail.back"] })).toBeVisible();
    await expect(jsonLd(page)).toHaveCount(1);
  });

  test("reloading an open modal shows the full page", async ({ page }) => {
    await openModal(page);
    await page.reload();
    await expect(page).toHaveURL(itemUrl);
    await expect(modal(page)).toHaveCount(0);
    await expect(page.getByTestId("portfolio-listing")).toHaveCount(0);
    await expect(page.getByRole("link", { name: defaults["portfolio.detail.back"] })).toBeVisible();
    await expect(jsonLd(page)).toHaveCount(1);
  });

  test("a related-work card on a service page opens the full page (D2)", async ({ page }) => {
    await page.goto(`/services/${serviceByCategory(item.category).slug}`);
    await page.locator(`main a[href="/portfolio/${item.slug}"]`).click();
    await expect(page).toHaveURL(itemUrl);
    await expect(page.getByRole("link", { name: defaults["portfolio.detail.back"] })).toBeVisible();
    await expect(modal(page)).toHaveCount(0);
  });
});

test.describe("back and forward", () => {
  test("Back closes the modal and Forward reopens it", async ({ page }) => {
    await openModal(page);
    await page.goBack();
    await expect(page).toHaveURL(/\/portfolio$/);
    await expect(modal(page)).toBeHidden();
    await expect(cardLink(page)).toBeFocused();
    await expect(page).toHaveTitle(portfolioTitle);

    await page.goForward();
    await expect(page).toHaveURL(itemUrl);
    await expect(modal(page)).toBeVisible();
    await expect(modal(page)).toHaveAccessibleName(item.title);
  });

  test("Back keeps the grid's filter", async ({ page }) => {
    await openModal(page, "/portfolio?category=web-apps");
    await page.goBack();
    await expect(page).toHaveURL(/\/portfolio\?category=web-apps$/);
    await expect(
      page
        .getByRole("navigation", { name: defaults["portfolio.filter.label"] })
        .getByRole("link", { name: defaults["portfolio.filter.webApps"], exact: true }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("closing leaves the grid where it was scrolled", async ({ page }) => {
    const last = portfolioSeed.at(-1)!;
    await page.goto("/portfolio");
    await cardLink(page, last.title).scrollIntoViewIfNeeded();
    const scrolled = await page.evaluate(() => window.scrollY);
    await cardLink(page, last.title).click();
    await expect(modal(page)).toBeVisible();
    await page.goBack();
    await expect(modal(page)).toBeHidden();
    expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);
  });
});

test.describe("closing (D4)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  const ways: Record<string, (page: Page) => Promise<void>> = {
    "the Close button": (page) =>
      modal(page).getByRole("button", { name: defaults["portfolio.modal.close"] }).click(),
    Escape: (page) => page.keyboard.press("Escape"),
    "a backdrop click": (page) => page.mouse.click(4, 4),
  };

  for (const [way, close] of Object.entries(ways)) {
    test(`${way} goes Back to the grid`, async ({ page }) => {
      await openModal(page);
      await close(page);
      await expect(page).toHaveURL(/\/portfolio$/);
      await expect(modal(page)).toBeHidden();
      await expect(cardLink(page)).toBeFocused();
      // The page behind scrolls again: no dialog is left :modal.
      await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
      // Forward reopens it, so closing went back in history rather than pushing /portfolio.
      await page.goForward();
      await expect(modal(page)).toBeVisible();
    });
  }
});

test.describe("focus and nesting", () => {
  test("Tab never reaches the grid behind", async ({ page }) => {
    await openModal(page);
    // Focus stays in the dialog or moves to the browser's own controls (the body is then
    // active), never to the page behind (as in Phase 12).
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      expect(
        await modal(page).evaluate(
          (dialog) =>
            document.activeElement === document.body || dialog.contains(document.activeElement),
        ),
      ).toBe(true);
    }
  });

  test("Escape in the lightbox closes only the lightbox", async ({ page }) => {
    await openModal(page);
    await modal(page)
      .getByRole("button", { name: viewLabel(item.cover.alt) })
      .click();
    const lightbox = page.getByRole("dialog", {
      name: defaults["portfolio.detail.lightbox.label"],
    });
    await expect(lightbox).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(lightbox).toBeHidden();
    await expect(modal(page)).toBeVisible();
    await expect(page).toHaveURL(itemUrl);
  });

  test("the CTA leaves for the stepper with the service ticked", async ({ page }) => {
    await openModal(page);
    const service = serviceByCategory(item.category);
    await modal(page).getByRole("link", { name: defaults["home.cta.button"] }).click();
    await expect(page).toHaveURL(new RegExp(`/contact\\?service=${service.slug}$`));
    await expect(modal(page)).toBeHidden();
    await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
    await expect(page.locator(`input[type="checkbox"][value="${item.category}"]`)).toBeChecked();
  });

  test("a second card opens its own item after the first is closed", async ({ page }) => {
    await openModal(page);
    await page.keyboard.press("Escape");
    await expect(modal(page)).toBeHidden();
    await cardLink(page, second!.title).click();
    await expect(modal(page)).toHaveAccessibleName(second!.title);
  });
});

// An item unpublished after the grid loaded (D8 as amended 2026-10-23). No card links to a missing
// item, so the soft navigation goes through the app router that Next exposes on window.
test("an unpublished item shows the 404 view inside the modal", async ({ page }) => {
  await page.goto("/portfolio");
  await expect(cardLink(page)).toBeVisible();
  await page.evaluate(() =>
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      "/portfolio/no-such-item",
    ),
  );
  await expect(page).toHaveURL(/\/portfolio\/no-such-item$/);
  await expect(modal(page)).toHaveAccessibleName(notFoundCopy.heading);
  await expect(modal(page).getByTestId("not-found")).toBeVisible();
  await modal(page).getByRole("button", { name: defaults["portfolio.modal.close"] }).click();
  await expect(page).toHaveURL(/\/portfolio$/);
  await expect(cardLink(page)).toBeVisible();
});

test.describe("layout and motion", () => {
  test("fills a 360px screen with no sideways scroll (D5)", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openModal(page);
    // Measured once the opening rise has finished (D6).
    await expect.poll(async () => (await modal(page).boundingBox())?.y).toBe(0);
    const box = (await modal(page).boundingBox())!;
    expect(box.x).toBe(0);
    expect(box.width).toBe(360);
    expect(box.height).toBeCloseTo(800, 0);
    expect(
      await modal(page).evaluate((dialog) => {
        const scroller = dialog.firstElementChild!;
        return scroller.scrollWidth - scroller.clientWidth;
      }),
    ).toBeLessThanOrEqual(0);
  });

  test("is a panel from 768px (D5)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openModal(page);
    const box = (await modal(page).boundingBox())!;
    expect(box.x).toBeGreaterThan(0);
    expect(box.y).toBeGreaterThan(0);
  });

  test("animates only when motion is allowed (D6)", async ({ page }) => {
    const duration = () =>
      modal(page).evaluate((dialog) => parseFloat(getComputedStyle(dialog).transitionDuration));
    await openModal(page);
    expect(await duration()).toBe(0.2);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openModal(page);
    expect(await duration()).toBeLessThanOrEqual(0.0001);
  });

  test("its text meets its contrast ratios (C5)", async ({ page }) => {
    await openModal(page);
    // The dialog fades in from opacity 0 (D6), and the sampler skips invisible text, so wait for it
    // (preview-e2e on #66 sampled nothing once).
    await expect
      .poll(async () => (await contrastFailures(page, modal(page))).count)
      .toBeGreaterThan(5);
    const { failures } = await contrastFailures(page, modal(page));
    expect(failures).toEqual([]);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("a card loads the full page (C6)", async ({ page }) => {
    await page.goto("/portfolio");
    // PPR-streamed content stays hidden with JS off (Phase 11 lesson), so the card link is found by
    // CSS and activated with a dispatched click, which follows a plain link as the browser would.
    await page.locator(`a[href="/portfolio/${item.slug}"]`).first().dispatchEvent("click");
    await expect(page).toHaveURL(itemUrl);
    await expect(modal(page)).toHaveCount(0);
    await expect(jsonLd(page)).toHaveCount(1);
  });
});
