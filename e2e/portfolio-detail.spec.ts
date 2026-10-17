import { expect, type Page } from "@playwright/test";
import { defaults } from "../content/defaults";
import { siteName } from "../lib/site";
import { portfolioSeed } from "../prisma/seed-data/portfolio";
import { expectOnlyKeyedText } from "./keyed-text";
import { portfolioState, test } from "./portfolio-expect";

// Phase 12 "Done when": each item has its own page, metadata and JSON-LD (Phase 12 spec, D13).
// The ready cases run on the Vercel preview (seeded database), the unavailable case in CI (no
// database), and the gallery and lightbox on the /dev fixture page, which needs neither.

const lightbox = (page: Page) =>
  page.getByRole("dialog", { name: defaults["portfolio.detail.lightbox.label"] });
const viewLabel = (alt: string) => defaults["portfolio.detail.view"].replace("{alt}", alt);
const position = (n: number, total: number) =>
  defaults["portfolio.detail.lightbox.position"]
    .replace("{n}", String(n))
    .replace("{total}", String(total));
/** The lightbox image on show: the one wrapper that is not hidden. */
const shownImage = (page: Page) =>
  lightbox(page).locator("[data-testid=lightbox-image]:not([hidden]) img");

/** Every robots meta says noindex; the not-found render can emit more than one. */
async function expectNoindex(page: Page) {
  const robots = await page
    .locator('meta[name="robots"]')
    .evaluateAll((metas) => metas.map((meta) => meta.getAttribute("content")));
  expect(robots.length).toBeGreaterThan(0);
  for (const content of robots) expect(content).toMatch(/noindex/);
}

async function jsonLd(page: Page) {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.map((text) => JSON.parse(text) as Record<string, unknown>);
}

test.describe("/portfolio/[slug] with published items", () => {
  for (const item of portfolioSeed) {
    test(`/portfolio/${item.slug}`, async ({ page }) => {
      test.skip((await portfolioState(page)) !== "ready", "needs published items");
      const response = await page.goto(`/portfolio/${item.slug}`);
      expect(response?.status()).toBe(200);

      await expect(page).toHaveTitle(`${item.title} | ${siteName}`);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        item.summary,
      );
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(item.title);
      const main = page.locator("main");
      await expect(main).toContainText(item.description);
      await expect(
        main
          .getByRole("region", { name: defaults["portfolio.detail.highlights"], exact: true })
          .getByRole("listitem"),
      ).toHaveText(item.highlights);
      await expect(
        main
          .getByRole("region", { name: defaults["portfolio.tech"], exact: true })
          .getByRole("listitem"),
      ).toHaveText(item.techStack);

      const live = main.getByRole("link", { name: new RegExp(defaults["portfolio.live"]) });
      await expect(live).toHaveAttribute("href", new URL(item.liveUrl).href);
      await expect(live).toHaveAttribute("target", "_blank");
      await expect(live).toHaveAttribute("rel", "noopener noreferrer");
      const repo = main.getByRole("link", { name: new RegExp(defaults["portfolio.detail.repo"]) });
      if (item.repoUrl) await expect(repo).toHaveAttribute("href", item.repoUrl);
      else await expect(repo).toHaveCount(0);

      // The credit links to the personal portfolio (D8).
      const credit = page.getByTestId("portfolio-credit").getByRole("link");
      await expect(credit).toContainText(item.credit!);
      await expect(credit).toHaveAttribute("href", new URL(item.creditUrl!).href);
      await expect(credit).toHaveAttribute("rel", "noopener noreferrer");

      await expect(main.getByRole("link", { name: defaults["home.cta.button"] })).toHaveAttribute(
        "href",
        "/contact",
      );
      await expect(
        main.getByRole("link", { name: defaults["portfolio.detail.back"] }),
      ).toHaveAttribute("href", "/portfolio");

      // The hero is the LCP image (D4); the seeded items have no gallery yet.
      const hero = main.getByRole("button", { name: viewLabel(item.cover.alt) });
      await expect(hero.getByRole("img")).toHaveAttribute("fetchpriority", "high");
      await expect(page.getByTestId("portfolio-gallery")).toHaveCount(0);

      const [data, ...rest] = await jsonLd(page);
      expect(rest).toEqual([]);
      expect(data).toMatchObject({
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: item.title,
        description: item.summary,
        datePublished: item.publishedAt,
        genre: defaults["services.webApp.name"],
        creditText: item.credit,
        sameAs: new URL(item.liveUrl).href,
        creator: { "@type": "Organization", name: siteName },
      });
      expect(data?.url).toMatch(new RegExp(`/portfolio/${item.slug}$`));
      expect(data?.image).toMatch(/^https:\/\/res\.cloudinary\.com\/.+\/rhm\/portfolio_item\//);
      expect(data).not.toHaveProperty("video");

      // Text in <main> is copy or this item's own content.
      await expectOnlyKeyedText(page, [
        item.title,
        item.summary,
        item.description,
        ...item.highlights,
        ...item.techStack,
        item.credit!,
        item.cover.alt,
        "(opens in a new tab)",
      ]);
    });
  }

  test("a card on /portfolio opens its page", async ({ page }) => {
    test.skip((await portfolioState(page)) !== "ready", "needs published items");
    const [first] = portfolioSeed;
    const card = page.getByTestId("portfolio-listing").getByRole("article").first();
    await expect(card.getByRole("link")).toHaveCount(1);
    await card.getByRole("link", { name: first!.title, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/portfolio/${first!.slug}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(first!.title);
  });

  test("the hero opens the lightbox, Escape closes it and focus returns", async ({ page }) => {
    test.skip((await portfolioState(page)) !== "ready", "needs published items");
    const [first] = portfolioSeed;
    await page.goto(`/portfolio/${first!.slug}`);
    const hero = page.getByRole("button", { name: viewLabel(first!.cover.alt) });
    await hero.click();
    await expect(lightbox(page)).toBeVisible();
    await expect(
      lightbox(page).getByRole("button", { name: defaults["portfolio.detail.lightbox.close"] }),
    ).toBeFocused();
    await expect(shownImage(page)).toHaveAttribute("alt", first!.cover.alt);
    // One image: no counter and no Previous or Next.
    await expect(lightbox(page).getByRole("status")).toHaveText("");
    await expect(
      lightbox(page).getByRole("button", { name: defaults["portfolio.detail.lightbox.next"] }),
    ).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(lightbox(page)).toBeHidden();
    await expect(hero).toBeFocused();
  });

  // A soft 404 under Partial Prefetching, as on /services/[slug] (Phase 12 spec, D1 as amended;
  // Phase 5 spec, D1).
  for (const slug of ["no-such-item", "Not_A_Slug"]) {
    test(`/portfolio/${slug} renders the not-found page with noindex`, async ({ page }) => {
      test.skip((await portfolioState(page)) !== "ready", "needs a reachable database");
      const response = await page.goto(`/portfolio/${slug}`);
      expect([200, 404]).toContain(response?.status());
      await expectNoindex(page);
      await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
      await expect(page.getByTestId("portfolio-detail")).toHaveCount(0);
    });
  }
});

test.describe("/portfolio/[slug] while the portfolio is unavailable", () => {
  test("says so, links back and is not indexed (D3)", async ({ page }) => {
    test.skip((await portfolioState(page)) !== "unavailable", "needs the unavailable state");
    await page.goto(`/portfolio/${portfolioSeed[0]!.slug}`);
    const section = page.getByTestId("portfolio-detail-unavailable");
    await expect(section.getByRole("status")).toHaveText(defaults["portfolio.unavailable"]);
    await expect(
      section.getByRole("link", { name: defaults["portfolio.detail.back"] }),
    ).toHaveAttribute("href", "/portfolio");
    await expect(
      page.locator("main").getByRole("link", { name: defaults["home.cta.button"] }),
    ).toHaveAttribute("href", "/contact");
    await expectNoindex(page);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
    await expectOnlyKeyedText(page);
  });
});

test.describe("/dev/portfolio-detail (D12)", () => {
  const alts = ["Fixture hero image", "Fixture gallery image one", "Fixture gallery image two"];

  test("shows images and videos in order, with no player before a click", async ({ page }) => {
    await page.goto("/dev/portfolio-detail");
    const tiles = page.getByTestId("portfolio-gallery").getByRole("listitem");
    expect(await tiles.evaluateAll((items) => items.map((li) => li.dataset.kind))).toEqual([
      "image",
      "video",
      "image",
      "video",
    ]);
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(tiles.nth(0).locator("figcaption")).toHaveText("The first gallery caption");
    await expect(
      tiles.nth(1).getByRole("link", { name: "Play video: Fixture YouTube video" }),
    ).toBeVisible();
    // A video with no title of its own is named after the item.
    await expect(
      tiles.nth(3).getByRole("link", { name: "Play video: Fixture project" }),
    ).toBeVisible();
    await expect(page.getByTestId("portfolio-credit").getByRole("link")).toHaveAttribute(
      "href",
      "https://example.org/",
    );
    await expect(
      page.getByRole("region", { name: defaults["portfolio.detail.client"] }),
    ).toContainText("Fixture client");
  });

  test("the lightbox moves through every image and returns focus", async ({ page }) => {
    await page.goto("/dev/portfolio-detail");
    const opener = page.getByRole("button", { name: viewLabel(alts[2]!) });
    await opener.click();
    const box = lightbox(page);
    await expect(box).toBeVisible();
    await expect(box.getByRole("status")).toHaveText(position(3, 3));
    await expect(shownImage(page)).toHaveAttribute("alt", alts[2]!);
    // The image is shown whole, not cropped (D6).
    await expect(shownImage(page)).toHaveClass(/object-contain/);

    const next = box.getByRole("button", {
      name: new RegExp(defaults["portfolio.detail.lightbox.next"]),
    });
    const previous = box.getByRole("button", {
      name: new RegExp(defaults["portfolio.detail.lightbox.previous"]),
    });
    await next.click(); // wraps to the first
    await expect(box.getByRole("status")).toHaveText(position(1, 3));
    await expect(shownImage(page)).toHaveAttribute("alt", alts[0]!);
    await page.keyboard.press("ArrowRight");
    await expect(box.getByRole("status")).toHaveText(position(2, 3));
    await expect(box).toContainText("The first gallery caption");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(box.getByRole("status")).toHaveText(position(3, 3));
    await previous.click();
    await expect(shownImage(page)).toHaveAttribute("alt", alts[1]!);

    // The page behind is inert while it is open: Tab stays in the dialog, or moves to the
    // browser's own controls (the body is then active), never to the page.
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      expect(
        await box.evaluate(
          (dialog) =>
            document.activeElement === document.body || dialog.contains(document.activeElement),
        ),
      ).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(box).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("a click on the backdrop closes the lightbox", async ({ page }) => {
    await page.goto("/dev/portfolio-detail");
    const opener = page.getByRole("button", { name: viewLabel(alts[1]!) });
    await opener.click();
    await expect(lightbox(page)).toBeVisible();
    await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
    await page.mouse.click(4, 4);
    await expect(lightbox(page)).toBeHidden();
    await expect(opener).toBeFocused();
  });

  // The /dev layout has no site header or footer, so the shell checks do not apply; this is the
  // fixture's layout check at the narrowest width (C5).
  test("does not scroll sideways at 360px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/dev/portfolio-detail");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    ).toBeLessThanOrEqual(0);
  });

  test("shows the unavailable state", async ({ page }) => {
    await page.goto("/dev/portfolio-detail");
    await expect(page.getByTestId("portfolio-detail-unavailable").getByRole("status")).toHaveText(
      defaults["portfolio.unavailable"],
    );
  });
});
