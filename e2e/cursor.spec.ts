import { expect, type Page } from "@playwright/test";
import { fillToReview, formOn, stepHeading } from "./inquiry-steps";
import { test } from "./portfolio-expect";
import { routes } from "./routes";

// Phase 1 spec, base styles amended 2026-10-21: every visible, enabled link, button and checkbox or
// radio choice shows the pointer cursor (Tailwind v4's preflight gives buttons the default arrow).
// A cursor utility on the element itself, such as the lightbox's `cursor-zoom-in`, is kept.
const CLICKABLE = [
  "a[href]",
  "button:not(:disabled)",
  'input:is([type="checkbox"], [type="radio"]):not(:disabled)',
  'label:has(> input:is([type="checkbox"], [type="radio"]):not(:disabled))',
].join(", ");

/** Visible clickable elements without the pointer, as `tag "text": cursor` lines. */
async function wrongCursors(page: Page) {
  return page.locator(CLICKABLE).evaluateAll((elements) =>
    elements
      .filter((el) => el.checkVisibility())
      .map((el) => ({ el, cursor: getComputedStyle(el).cursor }))
      .filter(
        ({ el, cursor }) =>
          cursor !== "pointer" && !(el.getAttribute("class") ?? "").includes(`cursor-${cursor}`),
      )
      .map(
        ({ el, cursor }) =>
          `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 40)}": ${cursor}`,
      ),
  );
}

for (const width of [360, 1440]) {
  test.describe(`pointer cursor at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    for (const route of routes) {
      test(`${route}: links, buttons and choices show the pointer`, async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState("load");
        expect(await wrongCursors(page)).toEqual([]);
      });
    }
  });
}

test("the open mobile nav shows the pointer", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  expect(await wrongCursors(page)).toEqual([]);
});

test("every inquiry step shows the pointer on its choices and buttons", async ({ page }) => {
  test.skip(!formOn, "INQUIRY_FORM_ENABLED is not 1 here");
  await page.goto("/contact");
  const failures: string[] = [];
  const record = async (step: string) =>
    failures.push(...(await wrongCursors(page)).map((line) => `${step} → ${line}`));
  await fillToReview(page, undefined, async (n) => record(`step ${n}`));
  await expect(stepHeading(page, 6)).toBeFocused();
  await record("step 6");
  expect(failures).toEqual([]);
});

test("control: the check reports a button with the default cursor", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Planted";
    button.style.cursor = "default";
    document.querySelector("main")?.append(button);
  });
  expect(await wrongCursors(page)).toContain('button "Planted": default');
});
