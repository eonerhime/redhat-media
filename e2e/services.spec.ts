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

  test("makes the whole card a link that lifts on hover only when motion is allowed (D1, amended)", async ({
    page,
  }) => {
    const [first] = visible;
    const card = page
      .locator("main li")
      .filter({ has: page.locator(`a[href="/services/${first.slug}"]`) });
    // Tailwind 4 moves with the `translate` property, not `transform`.
    const lift = () => card.evaluate((el) => getComputedStyle(el).translate);

    await page.emulateMedia({ reducedMotion: "no-preference" });
    await card.hover();
    await expect.poll(lift).toMatch(/^0px -\d/);

    await page.mouse.move(0, 0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await card.hover();
    await expect.poll(lift).toBe("none");

    // A click on the summary, away from the name, lands on the stretched link and opens the page.
    const box = await card.getByText(defaults[first.summaryKey]).boundingBox();
    if (!box) throw new Error("summary not rendered");
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page).toHaveURL(`/services/${first.slug}`);
  });

  test("shows no card arrow to a fine pointer (D1, amended)", async ({ page }) => {
    await expect(page.locator("main ul > li > span[aria-hidden]")).toHaveCount(visible.length);
    await expect(page.locator("main ul > li > span[aria-hidden]").first()).toBeHidden();
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

// Touch screens get no hover cue, so each card shows an arrow there (D1, amended 2026-10-22).
test.describe("services index on a touch screen", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 360, height: 800 } });

  test("shows an arrow on every service card", async ({ page }) => {
    await page.goto("/services");
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
    const arrows = page.locator("main ul > li > span[aria-hidden]");
    await expect(arrows).toHaveCount(visible.length);
    for (const arrow of await arrows.all()) await expect(arrow).toBeVisible();
  });
});
