import { expect, test } from "@playwright/test";
import { defaults } from "../content/defaults";
import { services } from "../content/services";
import { groupByPillar, resolveVisibility } from "../lib/content/services";
import { siteName } from "../lib/site";
import { expectOnlyKeyedText } from "./keyed-text";

// Expectations come from the config through the code path visiblePillars() uses, so adding or
// muting a service changes the page and this test together (Phase 4 spec, D5).
const visible = resolveVisibility(services);
const groups = groupByPillar(visible);
const muted = services.filter((s) => !visible.includes(s));

test.describe("services index", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/services");
  });

  test("has the heading, one section per visible pillar, then the CTA", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByRole("heading", { level: 1 })).toHaveText(
      defaults["services.index.heading"],
    );
    await expect(main.getByRole("heading", { level: 2 })).toHaveText([
      ...groups.map((g) => defaults[g.pillar.nameKey]),
      defaults["home.cta.heading"],
    ]);
  });

  test("lists each pillar's visible services, linking to their pages", async ({ page }) => {
    for (const { pillar, services: list } of groups) {
      const section = page.getByRole("region", { name: defaults[pillar.nameKey], exact: true });
      await expect(section).toContainText(defaults[pillar.summaryKey]);
      for (const key of pillar.stepKeys) await expect(section).toContainText(defaults[key]);
      const links = section.getByRole("heading", { level: 3 }).getByRole("link");
      await expect(links).toHaveText(list.map((s) => defaults[s.nameKey]));
      for (const [i, s] of list.entries()) {
        await expect(links.nth(i)).toHaveAttribute("href", `/services/${s.slug}`);
        await expect(section).toContainText(defaults[s.summaryKey]);
      }
    }
  });

  test("shows no muted service", async ({ page }) => {
    const main = page.locator("main");
    for (const s of muted) {
      await expect(main.locator(`a[href="/services/${s.slug}"]`)).toHaveCount(0);
    }
  });

  test("sends the CTA to /contact", async ({ page }) => {
    const cta = page.locator("main").getByRole("link", { name: defaults["home.cta.button"] });
    await expect(cta).toHaveCount(1);
    await expect(cta).toHaveAttribute("href", "/contact");
  });

  test("marks Services as the current nav item", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Services" }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("has its own title and the keyed description", async ({ page }) => {
    await expect(page).toHaveTitle(`${defaults["services.index.heading"]} | ${siteName}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      defaults["services.meta.description"],
    );
  });

  test("renders only text from content/defaults.ts in <main>", async ({ page }) => {
    await expectOnlyKeyedText(page);
  });
});
