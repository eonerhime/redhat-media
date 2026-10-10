import { expect, test } from "@playwright/test";
import { defaults } from "../content/defaults";
import { services } from "../content/services";
import { pillarOf, resolveVisibility } from "../lib/content/services";
import { siteName } from "../lib/site";
import { expectOnlyKeyedText } from "./keyed-text";

// Expectations come from the config, so adding or muting a service changes the pages and this
// test together (Phase 4 spec, D5; Phase 5 spec, D8).
const visible = resolveVisibility(services);
const muted = services.filter((s) => !visible.includes(s));

for (const service of visible) {
  const path = `/services/${service.slug}`;
  const name = defaults[service.nameKey];
  const summary = defaults[service.summaryKey];
  const pillar = pillarOf(service);

  test.describe(path, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
    });

    test("has the pillar, name and summary, then the sections in order", async ({ page }) => {
      const main = page.locator("main");
      await expect(main).toContainText(defaults[pillar.nameKey]);
      await expect(main.getByRole("heading", { level: 1 })).toHaveText(name);
      await expect(main).toContainText(summary);
      await expect(main.getByRole("heading", { level: 2 })).toHaveText([
        defaults["services.detail.included"],
        defaults["services.detail.deliverables"],
        defaults["home.process.heading"],
        defaults["home.cta.heading"],
      ]);
    });

    test("lists what is included and what the client gets, in config order", async ({ page }) => {
      for (const [headingKey, keys] of [
        ["services.detail.included", service.includedKeys],
        ["services.detail.deliverables", service.deliverableKeys],
      ] as const) {
        const section = page.getByRole("region", { name: defaults[headingKey], exact: true });
        await expect(section.getByRole("listitem")).toHaveText(keys.map((key) => defaults[key]));
      }
    });

    test("shows its pillar's process steps", async ({ page }) => {
      const section = page.getByRole("region", {
        name: defaults["home.process.heading"],
        exact: true,
      });
      // Items after the first start with an aria-hidden arrow, so match each by containment.
      const steps = section.getByRole("listitem");
      await expect(steps).toHaveCount(pillar.stepKeys.length);
      for (const [i, key] of pillar.stepKeys.entries()) {
        await expect(steps.nth(i)).toContainText(defaults[key]);
      }
    });

    test("links back to /services", async ({ page }) => {
      const back = page.locator("main").getByRole("link", {
        name: defaults["services.detail.back"],
        exact: true,
      });
      await expect(back).toHaveAttribute("href", "/services");
      await back.click();
      await expect(page).toHaveURL(/\/services$/);
    });

    test("sends the CTA to /contact", async ({ page }) => {
      const cta = page.locator("main").getByRole("link", { name: defaults["home.cta.button"] });
      await expect(cta).toHaveCount(1);
      await expect(cta).toHaveAttribute("href", "/contact");
    });

    test("has its own title and description", async ({ page }) => {
      await expect(page).toHaveTitle(`${name} | ${siteName}`);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", summary);
    });

    test("has one Service JSON-LD block for this service", async ({ page }) => {
      const blocks = page.locator('script[type="application/ld+json"]');
      await expect(blocks).toHaveCount(1);
      const data = JSON.parse((await blocks.textContent()) ?? "");
      const origin = new URL(data.url).origin;
      expect(data).toEqual({
        "@context": "https://schema.org",
        "@type": "Service",
        name,
        description: summary,
        serviceType: name,
        url: `${origin}${path}`,
        provider: { "@type": "Organization", name: siteName, url: origin },
      });
    });

    test("marks Services as the current nav item", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await expect(
        page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Services" }),
      ).toHaveAttribute("aria-current", "page");
    });

    test("renders only text from content/defaults.ts in <main>", async ({ page }) => {
      await expectOnlyKeyedText(page);
    });
  });
}

test.describe("service pages that must not exist", () => {
  // Empty while nothing is muted; the validation's muting run fills it (Phase 5 spec, D1).
  for (const service of muted) {
    test(`muted ${service.slug} returns 404`, async ({ request }) => {
      expect((await request.get(`/services/${service.slug}`)).status()).toBe(404);
    });
  }

  // A soft 404 under Partial Prerender: the shell streams with 200 before notFound() runs
  // (owner decision, Phase 5 spec D1). A later Proxy check may make it a real 404.
  test("an unknown slug renders the not-found page with noindex", async ({ page }) => {
    const response = await page.goto("/services/branding");
    expect([200, 404]).toContain(response?.status());
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
    // The not-found UI has its own h1 ("404" until Phase 15), never a service name.
    for (const s of services) {
      await expect(
        page.getByRole("heading", { level: 1, name: defaults[s.nameKey], exact: true }),
      ).toHaveCount(0);
    }
  });
});
