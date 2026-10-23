import { expect, type Page } from "@playwright/test";
import { defaults } from "../content/defaults";
import { projectTypes } from "../content/project-types";
import { services } from "../content/services";
import { resolveVisibility } from "../lib/content/services";
import { portfolioSeed } from "../prisma/seed-data/portfolio";
import { continueButton, formOn, next, stepHeading, typeBox } from "./inquiry-steps";
// Sends the Vercel bypass header to a protected preview (PW_BASE_URL), like the other preview specs.
import { pinnedState, test } from "./portfolio-expect";

// Phase 21 spec, D9. "Start a project" on a service or portfolio detail page opens the stepper
// with that service ticked on step 1. The muted case is unit-tested (lib/inquiry/prefill.test.ts),
// because muting can't be toggled in a running build before Phase 31.

const visible = resolveVisibility(services);
const serviceBoxes = (page: Page) => page.locator('input[name="services"]');

/** Step 1 is showing, and exactly `categories` are ticked, once hydration has applied the pre-fill. */
async function expectTicked(page: Page, categories: readonly string[]) {
  await expect(stepHeading(page, 1)).toBeVisible();
  for (const category of categories)
    await expect(serviceBoxes(page).and(page.locator(`[value="${category}"]`))).toBeChecked();
  await expect
    .poll(() =>
      serviceBoxes(page).evaluateAll((boxes) =>
        boxes
          .filter((box) => (box as HTMLInputElement).checked)
          .map((box) => box.getAttribute("value")),
      ),
    )
    .toEqual([...categories]);
}

const followCta = (page: Page) =>
  page
    .locator("main")
    .getByRole("link", { name: defaults["home.cta.button"], exact: true })
    .click();

test.describe("contextual CTAs", () => {
  test.skip(!formOn, "the stepper is on only where INQUIRY_FORM_ENABLED=1");

  for (const service of visible)
    test(`/services/${service.slug} opens the stepper with ${service.category} ticked`, async ({
      page,
    }) => {
      await page.goto(`/services/${service.slug}`);
      await followCta(page);
      await expect(page).toHaveURL(`/contact?service=${service.slug}`);
      await expectTicked(page, [service.category]);
      // The pre-fill moves no focus (D7).
      await expect(stepHeading(page, 1)).not.toBeFocused();
    });

  test("a portfolio item opens the stepper with its category's service ticked", async ({
    page,
  }) => {
    const item = portfolioSeed[0];
    await page.goto(`/portfolio/${item.slug}`);
    // Wait for either state: the detail can stream in after the load event on the preview.
    const detail = page.getByTestId("portfolio-detail");
    await expect(detail.or(page.getByTestId("portfolio-detail-unavailable"))).toBeVisible();
    const ready = await detail.isVisible();
    if (pinnedState === "ready") expect(ready).toBe(true);
    test.skip(!ready, "the item needs the portfolio database (preview-e2e, or locally)");
    const service = visible.find((s) => s.category === item.category);
    if (!service) throw new Error(`${item.category} is muted; pick a visible item`);
    await followCta(page);
    await expect(page).toHaveURL(`/contact?service=${service.slug}`);
    await expectTicked(page, [service.category]);
  });

  test("an unknown value opens step 1 with nothing ticked and no error", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/contact?service=nope");
    // Hydration has run once Continue reacts: it refuses an empty step 1.
    await continueButton(page).click();
    await expect(stepHeading(page, 1)).toBeVisible();
    await expectTicked(page, []);
    expect(errors).toEqual([]);
  });

  test("the pre-filled service carries through to step 2", async ({ page }) => {
    const [service] = visible;
    await page.goto(`/contact?service=${service.slug}`);
    await expectTicked(page, [service.category]);
    await next(page, 2);
    const name = defaults[service.nameKey];
    const [firstType] = projectTypes[service.category];
    await expect(typeBox(page, name, defaults[firstType.labelKey])).toBeVisible();
    // The URL is left as it was (D7).
    await expect(page).toHaveURL(`/contact?service=${service.slug}`);
  });
});
