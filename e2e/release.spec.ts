import { expect, test, type Page } from "@playwright/test";

// Production-only checks (Phase 16 spec, D6): what previews cannot prove, because they carry
// noindex and serve the /dev pages. Run with PW_RELEASE=1 and PW_BASE_URL set to the production
// origin, as the production-checks job does. Skipped everywhere else.

const release = process.env.PW_RELEASE === "1";
const origin = process.env.PW_BASE_URL ? new URL(process.env.PW_BASE_URL).origin : "";

const devRoutes = ["/dev/error", "/dev/media", "/dev/portfolio-detail", "/dev/portfolio-states"];
const sharePages = ["/", "/services/photography", "/portfolio/sportspred"];

/** Width and height from a PNG's IHDR chunk. */
function pngSize(bytes: Buffer): { width: number; height: number } {
  expect(bytes.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

async function meta(page: Page, selector: string): Promise<string | null> {
  const el = page.locator(selector);
  return (await el.count()) === 0 ? null : el.first().getAttribute("content");
}

test.describe("release checks on production", () => {
  test.skip(!release, "production only: set PW_RELEASE=1 and PW_BASE_URL");

  for (const path of devRoutes) {
    test(`${path} answers 404 (Phase 8 spec, D11)`, async ({ request }) => {
      expect((await request.get(path)).status()).toBe(404);
    });
  }

  test("the site is crawlable: no noindex header, robots.txt allows / and names the sitemap", async ({
    request,
  }) => {
    const home = await request.get("/");
    expect(home.status()).toBe(200);
    expect(home.headers()["x-robots-tag"] ?? "").not.toContain("noindex");

    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/^Allow: \/$/m);
    expect(robots).not.toMatch(/^Disallow: \/\s*$/m);
    expect(robots).toContain(`Sitemap: ${origin}/sitemap.xml`);
  });

  test("sitemap.xml uses the production origin and lists no /dev page", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const locs = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(0);
    for (const loc of locs) {
      expect(new URL(loc).origin).toBe(origin);
      expect(new URL(loc).pathname).not.toMatch(/^\/dev(\/|$)/);
    }
    expect(locs).toContain(`${origin}/portfolio/sportspred`);
  });

  for (const path of sharePages) {
    test(`${path}: production canonical and a 1200 × 630 share card`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      expect(await meta(page, 'meta[name="robots"]')).toBeNull();

      const canonical = new URL(
        (await page.locator('link[rel="canonical"]').getAttribute("href"))!,
      );
      expect(canonical.origin).toBe(origin);
      expect(canonical.pathname).toBe(path);
      expect(new URL((await meta(page, 'meta[property="og:url"]'))!).origin).toBe(origin);
      expect(await meta(page, 'meta[property="og:title"]')).toBeTruthy();
      expect(await meta(page, 'meta[property="og:description"]')).toBeTruthy();

      const image = new URL((await meta(page, 'meta[property="og:image"]'))!);
      expect(image.origin).toBe(origin);
      const img = await page.request.get(image.href);
      expect(img.status()).toBe(200);
      expect(img.headers()["content-type"]).toBe("image/png");
      expect(pngSize(await img.body())).toEqual({ width: 1200, height: 630 });
    });
  }
});
