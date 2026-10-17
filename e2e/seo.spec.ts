import { expect, test, type Page } from "@playwright/test";
import { services } from "../content/services";
import { resolveVisibility } from "../lib/content/services";
import { routes } from "./routes";

// Phase 14 spec, D1–D6, D11: metadata, share images, structured data, sitemap and robots on the
// local build (CI). The preview proves the same through the external validators (plan 4.3).

async function meta(page: Page, selector: string): Promise<string | null> {
  const el = page.locator(selector);
  return (await el.count()) === 0 ? null : el.first().getAttribute("content");
}

async function jsonLd(page: Page): Promise<Array<Record<string, unknown>>> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.map((text) => JSON.parse(text) as Record<string, unknown>);
}

/** Width and height from a PNG's IHDR chunk. */
function pngSize(bytes: Buffer): { width: number; height: number } {
  expect(bytes.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test.describe("SEO metadata on every route", () => {
  for (const route of routes) {
    test(`${route} has canonical, Open Graph and Twitter tags`, async ({ page }) => {
      await page.goto(route);
      const path = route.split("?")[0]!;
      const canonical = page.locator('link[rel="canonical"]');
      const noindex = (await meta(page, 'meta[name="robots"]'))?.includes("noindex") ?? false;
      if (path === "/portfolio" || noindex) {
        // Filtered views stay indexable; unknown and unavailable pages are not indexed (D2).
        await expect(canonical).toHaveCount(0);
      } else {
        await expect(canonical).toHaveCount(1);
        const href = new URL((await canonical.getAttribute("href"))!);
        expect(href.pathname.replace(/\/$/, "") || "/").toBe(path);
        expect(href.search).toBe("");
      }
      // An unavailable page sends only its title and noindex (lib/seo/metadata.ts).
      if (noindex) return;

      expect(await meta(page, 'meta[property="og:title"]')).toBe(await page.title());
      expect(await meta(page, 'meta[property="og:description"]')).toBeTruthy();
      expect(new URL((await meta(page, 'meta[property="og:url"]'))!).pathname).toBe(path);
      expect(await meta(page, 'meta[name="twitter:card"]')).toBe("summary_large_image");

      // The share image is absolute, and answers a 1200 × 630 PNG (D1, D3).
      const image = new URL((await meta(page, 'meta[property="og:image"]'))!);
      const res = await page.request.get(image.pathname + image.search);
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toBe("image/png");
      expect(pngSize(await res.body())).toEqual({ width: 1200, height: 630 });
    });
  }
});

test.describe("structured data (D6)", () => {
  test("/ has one Organization", async ({ page }) => {
    await page.goto("/");
    const orgs = (await jsonLd(page)).filter((block) => block["@type"] === "Organization");
    expect(orgs).toHaveLength(1);
    expect(orgs[0]).toMatchObject({
      name: "RedHat Media",
      address: { addressLocality: "Lagos", addressCountry: "NG" },
    });
    const logo = new URL(orgs[0]!.logo as string);
    expect((await page.request.get(logo.pathname)).status()).toBe(200);
  });

  test("/contact has one LocalBusiness linked to the Organization", async ({ page }) => {
    await page.goto("/contact");
    const blocks = (await jsonLd(page)).filter((block) => block["@type"] === "LocalBusiness");
    expect(blocks).toHaveLength(1);
    const org = (blocks[0]!.parentOrganization as { "@id": string })["@id"];
    expect(new URL(org).hash).toBe("#organization");
  });
});

test.describe("sitemap and robots (D4, D5)", () => {
  test("sitemap.xml lists the visible services and no /dev or /cms page", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const locs = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      ([, loc]) => new URL(loc!).pathname,
    );
    for (const path of ["/", "/services", "/about", "/portfolio", "/contact"]) {
      expect(locs).toContain(path);
    }
    for (const service of resolveVisibility(services)) {
      expect(locs).toContain(`/services/${service.slug}`);
    }
    for (const loc of locs) expect(loc).not.toMatch(/^\/(dev|cms)(\/|$)/);
  });

  test("robots.txt points at the sitemap and disallows nothing", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toMatch(/^Sitemap: https?:\/\/[^\s]+\/sitemap\.xml$/m);
    expect(text).not.toMatch(/Disallow/i);
  });
});
