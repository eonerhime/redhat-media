import { expect, type Page } from "@playwright/test";
import { notFoundCopy, siteName } from "../lib/site";
import { test } from "./portfolio-expect";

// Phase 15 spec, D1: one branded 404 view, with the site's header and footer, for unmatched URLs
// (a real 404) and for unknown slugs (the soft 404 kept by Phase 14 spec, D10).

async function expectNotFoundView(page: Page) {
  const view = page.getByTestId("not-found");
  await expect(view.getByRole("heading", { level: 1 })).toHaveText(notFoundCopy.heading);
  await expect(view.getByText(notFoundCopy.body)).toBeVisible();
  for (const link of [...notFoundCopy.links, notFoundCopy.cta]) {
    await expect(view.getByRole("link", { name: link.label, exact: true })).toHaveAttribute(
      "href",
      link.href,
    );
  }
  await expect(page.locator("header").first()).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
  await expect(page.locator("main#main")).toHaveCount(1);
  const robots = await page
    .locator('meta[name="robots"]')
    .evaluateAll((metas) => metas.map((meta) => meta.getAttribute("content")));
  expect(robots.length).toBeGreaterThan(0);
  for (const content of robots) expect(content).toMatch(/noindex/);
}

test.describe("404 page", () => {
  test("an unmatched URL answers 404 with the branded view", async ({ page }) => {
    const response = await page.goto("/no-such-page");
    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle(`${notFoundCopy.title} | ${siteName}`);
    await expectNotFoundView(page);
  });

  test("an unknown service slug shows the same view", async ({ page }) => {
    const response = await page.goto("/services/branding");
    expect([200, 404]).toContain(response?.status());
    await expectNotFoundView(page);
  });

  test("an invalid portfolio slug shows the same view", async ({ page }) => {
    // Rejected by the slug pattern before any read, so this holds without a database too.
    const response = await page.goto("/portfolio/Not_A_Slug");
    expect([200, 404]).toContain(response?.status());
    await expectNotFoundView(page);
  });

  test("its call to action leads to /contact", async ({ page }) => {
    await page.goto("/no-such-page");
    await page.getByTestId("not-found").getByRole("link", { name: notFoundCopy.cta.label }).click();
    await expect(page).toHaveURL(/\/contact$/);
  });
});
