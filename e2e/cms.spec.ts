import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import { totpCode } from "../lib/auth/test-totp";
import { test } from "./portfolio-expect";
import { routes } from "./routes";

// The hidden staff entry (Phase 24 spec, D7, D11, D13, D14, D17; validation.md).
//
// E2E_CMS=on (preview-e2e: Vercel Preview has CMS_ENABLED=1 and a database):
// the login page, its noindex and a11y, the signed-out redirects, the generic
// error and the endpoint allowlist. Otherwise (the ci job, where CMS_ENABLED is
// unset): every /cms and /api/auth path is a 404. In both: no public page links
// to /cms. With E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD (an admin without 2FA,
// run locally), the full set-up, sign-in and sign-out flow runs too.

const cmsOn = process.env.E2E_CMS === "on";
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const bypassHeaders: Record<string, string> =
  process.env.PW_BASE_URL && bypass ? { "x-vercel-protection-bypass": bypass } : {};

const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function fetchPath(page: Page, path: string, init: { method?: string; data?: unknown } = {}) {
  return page.request.fetch(path, {
    method: init.method ?? "GET",
    headers: {
      ...bypassHeaders,
      ...(init.data ? { origin: new URL(page.url() || "http://x").origin } : {}),
    },
    data: init.data,
    maxRedirects: 0,
  });
}

test.describe("no public page links to /cms (roadmap)", () => {
  for (const route of routes) {
    test(`${route} has no /cms link`, async ({ page }) => {
      await page.goto(route);
      const hrefs = await page
        .locator("a[href]")
        .evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href));
      for (const href of hrefs) expect(new URL(href).pathname).not.toMatch(/^\/cms(\/|$)/);
    });
  }
});

test.describe("with CMS_ENABLED off (D11)", () => {
  test.skip(cmsOn, "the CMS is on here");

  for (const path of [
    "/cms",
    "/cms/login",
    "/cms/2fa",
    "/cms/2fa/setup",
    "/api/auth/get-session",
  ]) {
    test(`${path} is a 404`, async ({ page }) => {
      const response = await fetchPath(page, path);
      expect(response.status()).toBe(404);
    });
  }

  test("a sign-in POST is a 404", async ({ page }) => {
    const response = await fetchPath(page, "/api/auth/sign-in/email", {
      method: "POST",
      data: { email: "a@example.test", password: "x".repeat(12) },
    });
    expect(response.status()).toBe(404);
  });
});

test.describe("with CMS_ENABLED on", () => {
  test.skip(!cmsOn, "the CMS is off here (E2E_CMS=on to run)");

  test("/cms/login is noindex in its header and its meta tag (D13)", async ({ page }) => {
    const response = await page.goto("/cms/login");
    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex.*nofollow/,
    );
  });

  for (const path of ["/cms", "/cms/2fa/setup"]) {
    test(`signed out, ${path} goes to /cms/login (D13)`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/cms\/login$/);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Staff sign-in");
    });
  }

  test("a wrong password gets the generic message (D14)", async ({ page }) => {
    await page.goto("/cms/login");
    await page.getByLabel("Email").fill(`nobody-${Date.now()}@example.test`);
    await page.getByLabel("Password").fill("not-the-password-1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("#cms-login-error")).toHaveText(
      /Invalid email or password|Too many attempts/,
    );
  });

  for (const path of [
    "/api/auth/sign-up/email",
    "/api/auth/admin/list-users",
    "/api/auth/delete-user",
  ]) {
    test(`${path} is closed (D10, D19)`, async ({ page }) => {
      await page.goto("/cms/login");
      const response = await fetchPath(page, path, { method: "POST", data: {} });
      expect(response.status()).toBe(404);
    });
  }

  test("a sign-in POST from another origin is refused (D9)", async ({ page }) => {
    const response = await page.request.post("/api/auth/sign-in/email", {
      headers: { ...bypassHeaders, origin: "https://evil.example" },
      data: { email: "a@example.test", password: "x".repeat(12) },
    });
    expect(response.status()).toBe(403);
  });

  for (const width of [360, 1440]) {
    for (const path of ["/cms/login", "/cms/2fa"]) {
      test(`${path} has no WCAG A/AA violations at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
        expect(violations.flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.target}`))).toEqual([]);
      });
    }
  }
});

test.describe("full sign-in flow (local, with a fresh admin)", () => {
  test.skip(
    !cmsOn || !adminEmail || !adminPassword,
    "needs E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD",
  );

  test("sets up 2FA, signs out, signs in with a code and signs out (D7, D17)", async ({ page }) => {
    await page.goto("/cms/login");
    await page.getByLabel("Email").fill(adminEmail!);
    await page.getByLabel("Password").fill(adminPassword!);
    await page.getByRole("button", { name: "Sign in" }).click();

    // No 2FA yet: /cms sends the admin to set it up.
    await expect(page).toHaveURL(/\/cms\/2fa\/setup$/);
    await page.getByLabel("Confirm your password").fill(adminPassword!);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(
      page.getByRole("img", { name: "QR code for your authenticator app" }),
    ).toBeVisible();
    const secret = (await page.getByTestId("totp-key").innerText()).replace(/\s+/g, "");
    await page.getByLabel("Then enter the 6-digit code it shows").fill(totpCode(secret));
    await page.getByRole("button", { name: "Turn on two-factor sign-in" }).click();
    await expect(page.getByTestId("backup-codes").getByRole("listitem")).toHaveCount(10);
    await page.getByRole("link", { name: "I've saved them. Continue" }).click();

    await expect(page.getByText("Signed in as")).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/cms\/login$/);

    // Signed out: /cms is closed again.
    await page.goto("/cms");
    await expect(page).toHaveURL(/\/cms\/login$/);

    // Back in, now with a code.
    await page.getByLabel("Email").fill(adminEmail!);
    await page.getByLabel("Password").fill(adminPassword!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/cms\/2fa$/);
    await page.getByLabel("6-digit code from your authenticator app").fill(totpCode(secret));
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page.getByText("Signed in as")).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/cms\/login$/);
  });
});
