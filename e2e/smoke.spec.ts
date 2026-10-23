import { expect, type Locator, type Page } from "@playwright/test";
import { defaults } from "../content/defaults";
import { contact } from "../lib/site";
import { pinnedState, test } from "./portfolio-expect";

// Phase 15 spec, D5: home → services → a service → portfolio → an item → contact, by following
// links as a visitor would. With no database (CI) the portfolio shows its unavailable state and
// the walk goes on to /contact through that page's CTA; a run pinned to "ready" must take the
// full path. Phase 16 runs this against production through PW_BASE_URL.

type Mode = "desktop" | "mobile" | "keyboard";
const viewports = { desktop: 1440, mobile: 360, keyboard: 1440 } as const;

/** Console errors, page errors and CSP violations seen so far. */
function watchProblems(page: Page) {
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(`page error: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`console: ${message.text()}`);
  });
  return problems;
}

/** Tab until `target` has focus, then press Enter. */
async function tabTo(page: Page, target: Locator) {
  for (let i = 0; i < 200; i++) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((el) => el === document.activeElement)) {
      await page.keyboard.press("Enter");
      return;
    }
  }
  throw new Error(`could not reach ${target.toString()} with Tab`);
}

async function follow(page: Page, mode: Mode, target: Locator) {
  if (mode === "keyboard") await tabTo(page, target);
  else await target.click();
}

/** Follows a header nav link; on mobile the menu opens first. */
async function viaNav(page: Page, mode: Mode, label: string) {
  if (mode === "mobile") await page.getByRole("button", { name: "Menu" }).click();
  const nav = page.getByRole("navigation", { name: "Main" });
  await follow(page, mode, nav.getByRole("link", { name: label, exact: true }));
}

async function expectStep(page: Page, path: RegExp) {
  await expect(page).toHaveURL(path);
  await expect(page.getByRole("heading", { level: 1 })).not.toBeEmpty();
}

for (const mode of ["desktop", "mobile", "keyboard"] as const) {
  test.describe(`smoke (${mode})`, () => {
    test.use({ viewport: { width: viewports[mode], height: 900 } });

    test("home → services → a service → portfolio → an item → contact", async ({ page }) => {
      const problems = watchProblems(page);
      const main = page.locator("main");

      const response = await page.goto("/");
      expect(response?.status()).toBe(200);
      await expectStep(page, /\/$/);

      await viaNav(page, mode, "Services");
      await expectStep(page, /\/services$/);

      await follow(page, mode, main.locator('a[href^="/services/"]').first());
      await expectStep(page, /\/services\/[a-z-]+$/);

      await viaNav(page, mode, "Portfolio");
      await expectStep(page, /\/portfolio$/);
      const listing = page.getByTestId("portfolio-listing");
      const state = await listing.getAttribute("data-state");
      if (pinnedState === "ready") expect(state).toBe("ready");

      // On /portfolio an item opens as a modal over the grid, and its CTA is the next step (Phase
      // 22 spec, D1–D3).
      let scope = main;
      if (state === "ready") {
        await follow(page, mode, main.locator('a[href^="/portfolio/"]').first());
        await expect(page).toHaveURL(/\/portfolio\/[a-z0-9-]+$/);
        scope = page.getByTestId("portfolio-modal");
        await expect(scope.getByTestId("portfolio-detail")).toBeVisible();
        await expect(scope.getByRole("heading", { level: 1 })).not.toBeEmpty();
      }
      await follow(
        page,
        mode,
        scope.getByRole("link", { name: defaults["home.cta.button"], exact: true }),
      );
      // A service or portfolio item's CTA pre-fills the stepper (Phase 21 spec, D3).
      await expectStep(page, /\/contact(\?service=[a-z0-9-]+)?$/);
      for (const href of [`mailto:${contact.email}`, contact.phoneHref, contact.whatsappHref])
        await expect(main.locator(`a[href^="${href}"]`).first()).toBeVisible();

      expect(problems).toEqual([]);
    });
  });
}
