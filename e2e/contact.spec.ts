import { expect, test, type Locator } from "@playwright/test";
import { defaults } from "../content/defaults";
import { contact, siteName } from "../lib/site";
import { expectOnlyKeyedText } from "./keyed-text";
import { routes } from "./routes";

// Phase 13 spec, D8. "Done when": every CTA on the site leads to /contact, and the links work on
// mobile. No database is needed, so this runs in CI only.
const mailto = `mailto:${contact.email}`;
const subjectMailto = `${mailto}?subject=${encodeURIComponent(defaults["contact.email.subject"])}`;
const siteValues = [
  contact.email,
  contact.phoneDisplay,
  contact.phoneInternational,
  contact.location,
  contact.hours,
  "(opens in a new tab)",
];

/** WCAG 2.5.5 / Apple: at least 44 × 44 CSS px (D4). */
async function expectTapTarget(link: Locator) {
  const box = await link.boundingBox();
  expect(box, "the link is laid out").not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
}

test.describe("contact page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test("has its heading, sections and metadata", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByRole("heading", { level: 1 })).toHaveText(defaults["contact.heading"]);
    await expect(main).toContainText(defaults["contact.intro"]);
    await expect(main.getByRole("heading", { level: 2 })).toHaveText([
      defaults["contact.channels.heading"],
      defaults["contact.next.heading"],
      defaults["contact.brief.heading"],
    ]);
    await expect(main.getByRole("heading", { level: 3 })).toHaveText([
      defaults["contact.email.label"],
      defaults["contact.phone.label"],
      defaults["contact.whatsapp.label"],
      defaults["contact.location.label"],
    ]);
    await expect(page).toHaveTitle(`${defaults["contact.heading"]} | ${siteName}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      defaults["contact.meta.description"],
    );
  });

  test("shows every channel, the hours and the response expectation", async ({ page }) => {
    const address = page.locator("main address");
    for (const value of [
      contact.email,
      contact.phoneDisplay,
      contact.phoneInternational,
      contact.location,
      contact.hours,
    ])
      await expect(address).toContainText(value);
    await expect(
      page.getByRole("region", { name: defaults["contact.next.heading"] }).getByRole("listitem"),
    ).toHaveText([
      defaults["contact.next.send"],
      defaults["contact.next.reply"],
      defaults["contact.next.scope"],
    ]);
    const brief = page.getByRole("region", { name: defaults["contact.brief.heading"] });
    await expect(brief.getByRole("listitem")).toHaveText([
      defaults["contact.brief.service"],
      defaults["contact.brief.goal"],
      defaults["contact.brief.timeline"],
      defaults["contact.brief.budget"],
      defaults["contact.brief.examples"],
    ]);
    await expect(
      brief.getByRole("link", { name: defaults["contact.brief.services"] }),
    ).toHaveAttribute("href", "/services");
  });

  test("links each channel with the right scheme", async ({ page }) => {
    const main = page.locator("main");
    await expect(
      main.getByRole("link", { name: defaults["contact.email.button"] }),
    ).toHaveAttribute("href", subjectMailto);
    await expect(main.getByRole("link", { name: contact.email })).toHaveAttribute("href", mailto);
    for (const name of [contact.phoneDisplay, contact.phoneInternational])
      await expect(main.getByRole("link", { name })).toHaveAttribute("href", contact.phoneHref);
    const whatsapp = main.getByRole("link", { name: defaults["contact.whatsapp.link"] });
    await expect(whatsapp).toHaveAttribute("href", contact.whatsappHref);
    await expect(whatsapp).toHaveAttribute("target", "_blank");
    await expect(whatsapp).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("marks Contact as the current page in the nav", async ({ page }) => {
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Contact" }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("has no CTA back to itself", async ({ page }) => {
    await expect(
      page.locator("main").getByRole("link", { name: defaults["home.cta.button"] }),
    ).toHaveCount(0);
  });

  test("shows only keyed copy and site data", async ({ page }) => {
    await expectOnlyKeyedText(page, siteValues);
  });

  test("copies the email address and announces it", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByRole("button", { name: defaults["contact.email.copy"] }).click();
    await expect(page.getByRole("status")).toHaveText(defaults["contact.email.copied"]);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(contact.email);
  });
});

test.describe("contact page on a phone", () => {
  test.use({ viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true });

  test("every contact link is a 44px tap target and nothing scrolls sideways", async ({ page }) => {
    await page.goto("/contact");
    const main = page.locator("main");
    for (const name of [
      defaults["contact.email.button"],
      contact.email,
      contact.phoneDisplay,
      contact.phoneInternational,
      defaults["contact.whatsapp.link"],
    ])
      await expectTapTarget(main.getByRole("link", { name }));
    await expectTapTarget(main.getByRole("button", { name: defaults["contact.email.copy"] }));
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBe(0);
  });

  test("tapping the homepage CTA opens /contact", async ({ page }) => {
    await page.goto("/");
    await page
      .locator("main")
      .getByRole("link", { name: defaults["home.cta.button"] })
      .first()
      .tap();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(defaults["contact.heading"]);
  });

  test("tapping Contact in the mobile nav opens /contact", async ({ page }) => {
    await page.goto("/about");
    await page.getByRole("button", { name: "Menu" }).tap();
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Contact" })
      .tap();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(defaults["contact.heading"]);
  });
});

// Every CTA on the site leads to /contact (roadmap Phase 13 "Done when").
for (const route of routes.filter((r) => r !== "/contact"))
  test(`every CTA on ${route} leads to /contact`, async ({ page }) => {
    await page.goto(route);
    const ctas = page.locator("main").getByRole("link", { name: defaults["home.cta.button"] });
    await expect(ctas.first()).toBeVisible();
    for (const cta of await ctas.all()) await expect(cta).toHaveAttribute("href", "/contact");
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Contact" }),
    ).toHaveAttribute("href", "/contact");
    // No link anywhere points at another contact-like URL.
    const hrefs = await page
      .locator("a[href]")
      .evaluateAll((links) => links.map((a) => a.getAttribute("href") ?? ""));
    expect(hrefs.filter((href) => /contact/i.test(href) && href !== "/contact")).toEqual([]);
  });
