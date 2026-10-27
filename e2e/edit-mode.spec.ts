import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type Route } from "@playwright/test";
import { continueButton, formOn } from "./inquiry-steps";
import { test, withBypass } from "./portfolio-expect";

// The edit-mode shell (Phase 26 spec, D2–D8, D10; validation.md).
//
// E2E_CMS=on (preview-e2e: Vercel Preview has CMS_ENABLED=1): the sign-in hint is
// set and /api/cms/session is answered with page.route() for each role, so roles
// preview has no account for are covered. Otherwise (the ci job, CMS off): there
// is no pill and no session request, even with the hint set.

const cmsOn = process.env.E2E_CMS === "on";
const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

type Answer = { role: "sales" | "editor" | "admin" | null; authenticated: boolean };

const signedOut: Answer = { role: null, authenticated: false };
const no2fa: Answer = { role: null, authenticated: true };
const sales: Answer = { role: "sales", authenticated: true };
const editor: Answer = { role: "editor", authenticated: true };
const admin: Answer = { role: "admin", authenticated: true };

const pill = (page: Page) => page.getByRole("button", { name: /^Editing: (On|Off)$/ });
const panelIcon = (page: Page) => page.getByRole("banner").getByRole("link", { name: /panel$/ });

/** Answers /api/cms/session with whatever `session.answer` holds now, and counts the requests. */
async function mockSession(page: Page, answer: Answer | "fail") {
  const session = { answer, reads: 0 };
  await page.route("**/api/cms/session", async (route: Route) => {
    session.reads += 1;
    if (session.answer === "fail") return route.abort("failed");
    await route.fulfill({
      status: 200,
      headers: { "cache-control": "no-store" },
      json: session.answer,
    });
  });
  return session;
}

/** Opens `/` with the sign-in hint set, as staff land after signing in. */
async function openAsStaff(page: Page, path = "/") {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("e2e:hinted")) {
      localStorage.setItem("rhm:staff", "1");
      sessionStorage.setItem("e2e:hinted", "1");
    }
  });
  await page.goto(path);
}

async function audit(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
  return violations.flatMap((v) => v.nodes.map((node) => `${v.id}: ${node.target.join(" ")}`));
}

/** The two boxes overlap. */
function overlaps(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

test.describe("with CMS_ENABLED off (C5)", () => {
  test.skip(cmsOn, "the CMS is on here");

  test("no pill and no session request, even with the hint set", async ({ page }) => {
    const session = await mockSession(page, admin);
    await openAsStaff(page);
    await page.waitForLoadState("networkidle");
    await expect(pill(page)).toHaveCount(0);
    await expect(panelIcon(page)).toHaveCount(0);
    expect(session.reads).toBe(0);
  });
});

test.describe("with the CMS on", () => {
  test.skip(!cmsOn, "needs E2E_CMS=on (a CMS-on build)");

  test("a visitor (no hint) makes no session request and sees no pill", async ({ page }) => {
    const session = await mockSession(page, admin);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(pill(page)).toHaveCount(0);
    await expect(panelIcon(page)).toHaveCount(0);
    expect(session.reads).toBe(0);
  });

  test("signed out: no pill, no icon, and the hint is dropped (Phase 25, D9)", async ({ page }) => {
    const session = await mockSession(page, signedOut);
    await openAsStaff(page);
    await expect.poll(() => session.reads).toBe(1);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("rhm:staff"))).toBeNull();
    await expect(pill(page)).toHaveCount(0);
    await expect(panelIcon(page)).toHaveCount(0);
  });

  test("signed in without 2FA: no pill, no icon, and the hint is kept", async ({ page }) => {
    const session = await mockSession(page, no2fa);
    await openAsStaff(page);
    await expect.poll(() => session.reads).toBe(1);
    await expect(pill(page)).toHaveCount(0);
    await expect(panelIcon(page)).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("rhm:staff"))).toBe("1");
  });

  test("sales staff get the panel icon but no pill (roadmap)", async ({ page }) => {
    await mockSession(page, sales);
    await openAsStaff(page);
    await expect(panelIcon(page)).toHaveAccessibleName("Sales panel");
    await expect(pill(page)).toHaveCount(0);
  });

  for (const [name, answer] of [
    ["an editor", editor],
    ["an admin", admin],
  ] as const) {
    test(`${name} sees the icon and the pill, Off at first (roadmap, D6)`, async ({ page }) => {
      await mockSession(page, answer);
      await openAsStaff(page);
      await expect(panelIcon(page)).toHaveAccessibleName(
        answer.role === "admin" ? "Admin panel" : "Editor panel",
      );
      await expect(pill(page)).toHaveText("Editing: Off");
      await expect(pill(page)).toHaveAttribute("aria-pressed", "false");
    });
  }

  test("the toggle survives a client navigation and a reload; a new tab starts Off (D6)", async ({
    page,
    context,
  }) => {
    await mockSession(page, editor);
    await openAsStaff(page);
    await pill(page).click();
    await expect(pill(page)).toHaveText("Editing: On");
    await expect(pill(page)).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("banner").getByRole("link", { name: "Services", exact: true }).click();
    await expect(page).toHaveURL(/\/services$/);
    await expect(pill(page)).toHaveText("Editing: On");

    await page.reload();
    await expect(pill(page)).toHaveText("Editing: On");

    // A new tab shares localStorage (the hint) but not sessionStorage (the toggle).
    const other = await withBypass(await context.newPage());
    await mockSession(other, editor);
    await other.goto("/");
    await expect(pill(other)).toHaveText("Editing: Off");
    await other.close();

    await pill(page).click();
    await expect(pill(page)).toHaveText("Editing: Off");
    expect(await page.evaluate(() => sessionStorage.getItem("rhm:editMode"))).toBe("0");
  });

  test("one session read per navigation, shared by the icon and the pill (D2, D3)", async ({
    page,
  }) => {
    const session = await mockSession(page, admin);
    await openAsStaff(page);
    await expect(pill(page)).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(session.reads).toBe(1);

    await page.getByRole("banner").getByRole("link", { name: "About", exact: true }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect.poll(() => session.reads).toBe(2);
    await page.getByRole("banner").getByRole("link", { name: "Contact", exact: true }).click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect.poll(() => session.reads).toBe(3);
  });

  test("a role that drops to sales removes the pill and the toggle (D3, D7)", async ({ page }) => {
    const session = await mockSession(page, editor);
    await openAsStaff(page);
    await pill(page).click();
    await expect(pill(page)).toHaveText("Editing: On");

    session.answer = sales;
    await page.getByRole("banner").getByRole("link", { name: "About", exact: true }).click();
    await expect(pill(page)).toHaveCount(0);
    await expect(panelIcon(page)).toHaveAccessibleName("Sales panel");
    expect(await page.evaluate(() => sessionStorage.getItem("rhm:editMode"))).toBeNull();
    expect(await page.evaluate(() => sessionStorage.getItem("rhm:role"))).toBe("sales");
  });

  test("a failed read keeps the last known role (D3)", async ({ page }) => {
    const session = await mockSession(page, editor);
    await openAsStaff(page);
    await expect(pill(page)).toBeVisible();

    session.answer = "fail";
    await page.getByRole("banner").getByRole("link", { name: "About", exact: true }).click();
    await expect.poll(() => session.reads).toBe(2);
    await expect(pill(page)).toBeVisible();
    await expect(panelIcon(page)).toHaveAccessibleName("Editor panel");
  });

  test("the pill is last in tab order and works from the keyboard (D5)", async ({ page }) => {
    await mockSession(page, editor);
    await openAsStaff(page);
    await expect(pill(page)).toBeVisible();
    await page.getByRole("contentinfo").getByRole("link").last().focus();
    await page.keyboard.press("Tab");
    await expect(pill(page)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(pill(page)).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Space");
    await expect(pill(page)).toHaveAttribute("aria-pressed", "false");
  });

  for (const width of [360, 1440]) {
    test.describe(`at ${width}px`, () => {
      test.use({ viewport: { width, height: 800 } });

      test("axe finds nothing with the pill Off and On (D5)", async ({ page }) => {
        await mockSession(page, editor);
        await openAsStaff(page);
        await expect(pill(page)).toHaveText("Editing: Off");
        expect(await audit(page)).toEqual([]);
        await pill(page).click();
        await expect(pill(page)).toHaveText("Editing: On");
        expect(await audit(page)).toEqual([]);
      });

      test("the pill covers no footer link when it is focused (C6)", async ({ page }) => {
        await mockSession(page, editor);
        await openAsStaff(page);
        const box = await pill(page).boundingBox();
        expect(box).not.toBeNull();
        const links = page.getByRole("contentinfo").getByRole("link");
        for (const link of await links.all()) {
          await link.focus();
          const target = await link.boundingBox();
          expect(target && overlaps(box!, target), await link.innerText()).toBeFalsy();
        }
      });

      test("scrolled to the end, the pill covers none of the footer (C6)", async ({ page }) => {
        await mockSession(page, editor);
        await openAsStaff(page);
        const box = (await pill(page).boundingBox())!;
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        // Every line of the footer, not only its links: the registration line sits bottom right.
        const lines = page.getByRole("contentinfo").locator("a, p, span");
        for (const line of await lines.all()) {
          const target = (await line.boundingBox())!;
          expect(overlaps(box, target), await line.innerText()).toBe(false);
        }
      });
    });
  }

  test.describe("on a phone (C6)", () => {
    test.use({ viewport: { width: 360, height: 800 } });

    test("the pill covers neither the menu button nor the open menu's links", async ({ page }) => {
      await mockSession(page, editor);
      await openAsStaff(page);
      const box = (await pill(page).boundingBox())!;
      const menu = page.getByRole("button", { name: "Menu" });
      expect(overlaps(box, (await menu.boundingBox())!)).toBe(false);
      await menu.click();
      const links = page.locator("#mobile-nav").getByRole("link");
      await expect(links.first()).toBeVisible();
      for (const link of await links.all()) {
        expect(overlaps(box, (await link.boundingBox())!), await link.innerText()).toBe(false);
      }
    });

    test("the inquiry stepper's buttons stay clear of the pill when focused", async ({ page }) => {
      test.skip(!formOn, "INQUIRY_FORM_ENABLED is not 1 here");
      await mockSession(page, editor);
      await openAsStaff(page, "/contact");
      // The form streams in after load, so wait for it rather than count what's there.
      const next = continueButton(page);
      await expect(next).toBeVisible();
      const box = (await pill(page).boundingBox())!;
      const buttons = page.locator("main form").getByRole("button");
      for (const button of await buttons.all()) {
        if (!(await button.isVisible())) continue;
        await button.focus();
        const target = (await button.boundingBox())!;
        expect(overlaps(box, target), await button.innerText()).toBe(false);
      }
    });
  });
});
