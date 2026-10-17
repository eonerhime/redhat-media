import { expect, test } from "@playwright/test";
import { defaults } from "../content/defaults";
import { services } from "../content/services";
import { groupByPillar, resolveVisibility } from "../lib/content/services";
import { contact, siteName } from "../lib/site";
import { expectOnlyKeyedText } from "./keyed-text";

// Expectations come from the config through the code path visiblePillars() uses, so muting a
// pillar changes the page and this test together (Phase 6 spec, D9).
const groups = groupByPillar(resolveVisibility(services));
const build = groups.find((g) => g.pillar.id === "build");

test.describe("about page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/about");
  });

  test("has the heading and intro, then the sections in order", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByRole("heading", { level: 1 })).toHaveText(defaults["about.heading"]);
    await expect(main).toContainText(defaults["about.intro"]);
    await expect(main.getByRole("heading", { level: 2 })).toHaveText([
      defaults["about.story.heading"],
      defaults["about.oneTeam.heading"],
      defaults["about.pillars.heading"],
      ...(build ? [defaults["about.sdd.heading"]] : []),
      defaults["home.cta.heading"],
    ]);
  });

  test("tells the story with the facts list", async ({ page }) => {
    const story = page.getByRole("region", { name: defaults["about.story.heading"] });
    await expect(story).toContainText(defaults["about.story.body"]);
    await expect(story.locator("dt")).toHaveText([
      defaults["about.facts.founded"],
      defaults["about.facts.leadership"],
      defaults["about.facts.registered"],
      defaults["about.facts.based"],
    ]);
    await expect(story.locator("dd")).toHaveText([
      defaults["about.founded.year"],
      defaults["about.founder.name"],
      defaults["about.founder.title"],
      contact.registration,
      contact.location,
    ]);
  });

  test("explains one team, every medium", async ({ page }) => {
    await expect(
      page.getByRole("region", { name: defaults["about.oneTeam.heading"] }),
    ).toContainText(defaults["about.oneTeam.body"]);
  });

  test("has one card per visible pillar with its role and steps", async ({ page }) => {
    const section = page.getByRole("region", { name: defaults["about.pillars.heading"] });
    await expect(section).toContainText(defaults["about.pillars.intro"]);
    await expect(section.getByRole("heading", { level: 3 })).toHaveText(
      groups.map((g) => defaults[g.pillar.nameKey]),
    );
    const cards = section.getByRole("listitem").filter({ has: page.getByRole("heading") });
    await expect(cards).toHaveCount(groups.length);
    for (const [i, { pillar }] of groups.entries()) {
      await expect(cards.nth(i)).toContainText(defaults[pillar.roleKey]);
      for (const key of pillar.stepKeys) await expect(cards.nth(i)).toContainText(defaults[key]);
    }
  });

  test("shows the SDD section only while Build is visible", async ({ page }) => {
    const section = page.getByRole("region", { name: defaults["about.sdd.heading"] });
    if (!build) {
      await expect(section).toHaveCount(0);
      return;
    }
    await expect(section).toContainText(defaults["about.sdd.body"]);
    for (const key of build.pillar.stepKeys) await expect(section).toContainText(defaults[key]);
    await expect(section.getByRole("link", { name: defaults["about.sdd.link"] })).toHaveAttribute(
      "href",
      `/services/${build.services[0].slug}`,
    );
  });

  test("sends the only CTA to /contact", async ({ page }) => {
    const cta = page.locator("main").getByRole("link", { name: defaults["home.cta.button"] });
    await expect(cta).toHaveCount(1);
    await expect(cta).toHaveAttribute("href", "/contact");
  });

  test("marks About as the current nav item", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "About" }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("has its own title and the keyed description", async ({ page }) => {
    await expect(page).toHaveTitle(`${defaults["about.heading"]} | ${siteName}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      defaults["about.meta.description"],
    );
  });

  test("renders only keyed text and the two site facts in <main>", async ({ page }) => {
    await expectOnlyKeyedText(page, [contact.registration, contact.location]);
  });
});
