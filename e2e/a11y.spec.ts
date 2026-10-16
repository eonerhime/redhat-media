import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import { RECOVER_KEY } from "../app/(dev)/dev/error/throw-once";
import { test } from "./portfolio-expect";
import { routes } from "./routes";

// Phase 15 spec, D4: zero WCAG 2.2 A/AA violations from axe on every route, the 404 page and the
// error view, at the narrowest and widest layouts, plus the states a URL alone cannot reach (the
// open mobile nav and the open lightbox). Runs in CI and, through PW_BASE_URL, on the preview.
const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const widths = [360, 1440];
const pages = [...routes, "/no-such-page", "/dev/error", "/dev/portfolio-detail"];

/** Violations as "rule: selector" lines, so a failure names what to fix. */
async function audit(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
  return violations.flatMap((v) => v.nodes.map((node) => `${v.id}: ${node.target.join(" ")}`));
}

/** Loads a page, or skips a /dev fixture where dev pages are off (Phase 8 spec, D11). */
async function open(page: Page, route: string) {
  const response = await page.goto(route);
  test.skip(route.startsWith("/dev/") && response?.status() === 404, "dev pages are off");
  if (route === "/dev/error") await expect(page.getByTestId("error-view")).toBeVisible();
  await page.waitForLoadState("load");
}

for (const width of widths) {
  test.describe(`axe at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    for (const route of pages) {
      test(`${route} has no WCAG A/AA violations`, async ({ page }) => {
        // The error fixture throws until this flag is set, so keep it unset here.
        await page.addInitScript((key) => sessionStorage.removeItem(key), RECOVER_KEY);
        await open(page, route);
        expect(await audit(page)).toEqual([]);
      });
    }
  });
}

test("control: the audit reports a planted violation", async ({ page }) => {
  await open(page, "/");
  // Plant only after streaming and hydration settle, so React cannot replace the node first.
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => {
    const img = document.createElement("img");
    img.src = "/icon.png";
    img.id = "planted";
    img.width = 32;
    img.height = 32;
    document.querySelector("main")?.append(img);
  });
  await expect(page.locator("#planted")).toBeVisible();
  expect(await audit(page)).toContain("image-alt: #planted");
});

test.describe("axe on interactive states", () => {
  test("the open mobile nav", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 900 });
    await open(page, "/");
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
    expect(await audit(page)).toEqual([]);
  });

  for (const route of ["/dev/portfolio-detail", "/portfolio/sportspred"]) {
    test(`the open lightbox on ${route}`, async ({ page }) => {
      await open(page, route);
      const view = page.getByRole("button", { name: /^View / }).first();
      test.skip((await view.count()) === 0, "no gallery here (the portfolio is unavailable)");
      await view.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      expect(await audit(page)).toEqual([]);
    });
  }
});
