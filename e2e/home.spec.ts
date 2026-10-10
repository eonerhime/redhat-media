import { expect, test } from "@playwright/test";
import { defaults } from "../content/defaults";
import { pillars, services } from "../content/services";

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
    const cards = page.locator("main article");
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

  // Roadmap "Done when": every text string is keyed (Phase 3 spec, D8).
  test("renders only text from content/defaults.ts in <main>", async ({ page }) => {
    const texts = await page.locator("main").evaluate((main) => {
      const found: string[] = [];
      const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
        const parent = node.parentElement;
        if (!text || !parent || parent.closest('[aria-hidden="true"]')) continue;
        found.push(text);
      }
      return found;
    });
    const values = new Set<string>(Object.values(defaults));
    expect(texts.length).toBeGreaterThan(0);
    expect(texts.filter((text) => !values.has(text))).toEqual([]);
  });
});
