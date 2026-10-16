import { expect, type Page } from "@playwright/test";
import { test } from "./portfolio-expect";
import { routes } from "./routes";

// Phase 14 spec, D8, D11. "Done when": the enforced CSP raises no console violations across every
// template. Runs in CI and, through PW_BASE_URL, on the Vercel preview with real Cloudinary images
// and the deployed headers. The fixture pages hold the lightbox and both video players.
const templates = [...routes, "/dev/media", "/dev/portfolio-detail"];

async function collectViolations(page: Page): Promise<() => Promise<string[]>> {
  const fromConsole: string[] = [];
  page.on("console", (message) => {
    if (/Content[- ]Security[- ]Policy/i.test(message.text())) fromConsole.push(message.text());
  });
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { __csp: string[] }).__csp = seen;
    document.addEventListener("securitypolicyviolation", (event) =>
      seen.push(`${event.effectiveDirective} blocked ${event.blockedURI || "inline"}`),
    );
  });
  return async () => [
    ...(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)),
    ...fromConsole,
  ];
}

test.describe("enforced CSP", () => {
  test("sends the policy as enforced, with no report-only copy", async ({ page }) => {
    const res = await page.goto("/");
    const headers = res!.headers();
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy-report-only"]).toBeUndefined();
  });

  for (const route of templates) {
    test(`${route} raises no violations`, async ({ page }) => {
      const violations = await collectViolations(page);
      const res = await page.goto(route);
      // The fixture pages 404 in production (Phase 8 spec, D11); nothing to check there.
      test.skip(route.startsWith("/dev/") && res?.status() === 404, "dev pages are off");
      await page.waitForLoadState("load");

      // The lightbox, where the page has one.
      const view = page.getByRole("button", { name: /^View / }).first();
      if ((await view.count()) > 0) {
        await view.click();
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.keyboard.press("Escape");
      }
      // Every video facade, so the YouTube and Vimeo iframes load.
      const play = page.getByRole("link", { name: /^Play video/ });
      const videos = await play.count();
      for (let i = 0; i < videos; i++) await play.first().click();
      if (videos > 0) await expect(page.locator("iframe")).toHaveCount(videos);

      await page.waitForTimeout(500);
      expect(await violations()).toEqual([]);
    });
  }
});
