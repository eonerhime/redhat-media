import { expect, test, type Page } from "@playwright/test";

// Phase 8 "Done when": an optimised image, and a video that loads its iframe
// only on click (Phase 8 spec, D12). The player and thumbnail hosts are routed
// to local stubs, so the suite does not depend on YouTube or Vimeo; the images
// come from the real Cloudinary cloud.

const ROUTE = "/dev/media";
const YOUTUBE = { title: "Big Buck Bunny on YouTube", id: "aqz-KE-bpKQ" };
const VIMEO = { title: "Big Buck Bunny on Vimeo", id: "1084537" };
const PLAYER_HOSTS = /^https:\/\/(www\.youtube-nocookie\.com|player\.vimeo\.com)\//;
const THUMBNAIL_HOSTS = /^https:\/\/(i\.ytimg\.com|i\.vimeocdn\.com)\//;
// CI sets the cloud name; locally any cloud name is accepted.
const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "[a-z0-9_-]+";
const cloudinaryUpload = new RegExp(`^https://res\\.cloudinary\\.com/${cloud}/image/upload/`);

// 1×1 transparent PNG.
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

type Fixture = { playerRequests: string[]; cspViolations: () => Promise<string[]> };

async function openMediaPage(page: Page): Promise<Fixture> {
  const playerRequests: string[] = [];
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { __csp: string[] }).__csp = seen;
    document.addEventListener("securitypolicyviolation", (event) => {
      seen.push(`${event.violatedDirective} ${event.blockedURI}`);
    });
  });
  await page.route(PLAYER_HOSTS, (route) => {
    playerRequests.push(route.request().url());
    return route.fulfill({ contentType: "text/html", body: "<!doctype html><title>stub</title>" });
  });
  await page.route(THUMBNAIL_HOSTS, (route) =>
    route.fulfill({ contentType: "image/png", body: PIXEL }),
  );
  await page.goto(ROUTE);
  return {
    playerRequests,
    cspViolations: () => page.evaluate(() => (window as unknown as { __csp: string[] }).__csp),
  };
}

const facade = (page: Page, title: string) =>
  page.getByRole("link", { name: `Play video: ${title}` });

test.describe("/dev/media images (Phase 8 spec, D5)", () => {
  test("the hero image is optimised, responsive, preloaded and loads", async ({ page }) => {
    await openMediaPage(page);
    const hero = page.getByRole("img", { name: "Sample photo, preloaded" });

    const src = await hero.getAttribute("src");
    expect(src).toMatch(cloudinaryUpload);
    expect(src).toContain("f_auto");
    expect(src).toContain("q_auto");
    expect(src).toContain("rhm/page/dev-media/sample");

    const srcset = (await hero.getAttribute("srcset")) ?? "";
    // Cloudinary URLs contain commas (c_fill,w_640,…), so split only before each URL.
    const candidates = srcset.split(/,\s+(?=https:)/);
    expect(candidates.length).toBeGreaterThanOrEqual(3);
    for (const candidate of candidates) expect(candidate).toMatch(cloudinaryUpload);
    expect(await hero.getAttribute("sizes")).toBeTruthy();

    await expect(hero).toHaveAttribute("fetchpriority", "high");
    await expect(hero).not.toHaveAttribute("loading", "lazy");
    const preload = page.locator('link[rel="preload"][as="image"]');
    await expect(preload.first()).toHaveAttribute("imagesrcset", /rhm\/page\/dev-media\/sample/);

    await expect
      .poll(() => hero.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
      .toBeGreaterThan(0);
  });

  test("the hero image ships with a data: blur placeholder", async ({ request }) => {
    // Read the server HTML: next/image clears the placeholder once the image loads.
    const html = await (await request.get(ROUTE)).text();
    const heroTag = html.match(/<img[^>]*alt="Sample photo, preloaded"[^>]*>/)?.[0] ?? "";
    expect(heroTag).toMatch(/background-image:url\(&quot;data:image\//);
  });

  test("the second image is lazy", async ({ page }) => {
    await openMediaPage(page);
    await expect(page.getByRole("img", { name: "Sample photo, lazy" })).toHaveAttribute(
      "loading",
      "lazy",
    );
  });
});

test.describe("/dev/media videos (Phase 8 spec, D9)", () => {
  test("nothing from the players loads before a click", async ({ page }) => {
    const { playerRequests } = await openMediaPage(page);
    await facade(page, VIMEO.title).scrollIntoViewIfNeeded();
    await expect(facade(page, YOUTUBE.title)).toBeVisible();
    await expect(page.locator("iframe")).toHaveCount(0);
    expect(playerRequests).toEqual([]);
  });

  test("each facade links to the video, for visitors without JavaScript", async ({ page }) => {
    await openMediaPage(page);
    await expect(facade(page, YOUTUBE.title)).toHaveAttribute(
      "href",
      `https://www.youtube.com/watch?v=${YOUTUBE.id}`,
    );
    await expect(facade(page, VIMEO.title)).toHaveAttribute(
      "href",
      `https://vimeo.com/${VIMEO.id}`,
    );
  });

  test("a click swaps the facade for one focused iframe", async ({ page }) => {
    const { playerRequests } = await openMediaPage(page);
    await facade(page, YOUTUBE.title).click();

    const frame = page.locator("iframe");
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute(
      "src",
      `https://www.youtube-nocookie.com/embed/${YOUTUBE.id}?autoplay=1&rel=0`,
    );
    await expect(frame).toHaveAttribute("title", YOUTUBE.title);
    await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toBe("IFRAME");
    await expect.poll(() => playerRequests.length).toBeGreaterThan(0);
  });

  test("Enter on a focused facade does the same", async ({ page }) => {
    await openMediaPage(page);
    await facade(page, VIMEO.title).focus();
    await page.keyboard.press("Enter");

    const frame = page.locator("iframe");
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute(
      "src",
      `https://player.vimeo.com/video/${VIMEO.id}?autoplay=1&dnt=1`,
    );
    await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toBe("IFRAME");
  });
});

test.describe("/dev/media page (Phase 8 spec, D11, D12)", () => {
  test("is not indexed", async ({ page }) => {
    await openMediaPage(page);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("raises no report-only CSP violation, before or after playing", async ({ page }) => {
    const { cspViolations } = await openMediaPage(page);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await facade(page, YOUTUBE.title).click();
    await facade(page, VIMEO.title).click();
    await expect(page.locator("iframe")).toHaveCount(2);
    expect(await cspViolations()).toEqual([]);
  });
});
