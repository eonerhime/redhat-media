import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type Route } from "@playwright/test";
import { defaults } from "../content/defaults";
import { test } from "./portfolio-expect";

// Editable text (Phase 27 spec, D2, D3, D9; validation.md).
//
// E2E_CMS=on (preview-e2e): /api/cms/session is answered with page.route(), as in
// edit-mode.spec.ts, so the ✎ controls appear for a mocked editor. The save itself reaches the real
// action, which refuses it: the mocked editor has no real session. That is the failure path (the
// dialog keeps the draft and shows the error); saving is covered by update-core.db.test.ts and the
// owner's preview check. Otherwise (the ci job, CMS off): no ✎ anywhere.

const cmsOn = process.env.E2E_CMS === "on";
const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const refused = "You can't edit this. Sign in again as an editor.";
const tagline = defaults["home.hero.tagline"];

type Role = "sales" | "editor" | "admin";

async function mockSession(page: Page, role: Role) {
  await page.route("**/api/cms/session", (route: Route) =>
    route.fulfill({
      status: 200,
      headers: { "cache-control": "no-store" },
      json: { role, authenticated: true },
    }),
  );
}

/** Opens `path` as signed-in staff (the sign-in hint set), with editing Off. */
async function openAsStaff(page: Page, role: Role, path = "/") {
  await mockSession(page, role);
  await page.addInitScript(() => localStorage.setItem("rhm:staff", "1"));
  await page.goto(path);
}

const pill = (page: Page) => page.getByRole("button", { name: /^Editing: (On|Off)$/ });
const pencils = (page: Page) => page.getByRole("button", { name: /^Edit "/ });
const pencil = (page: Page, text: string) =>
  page.getByRole("button", {
    name: `Edit "${text.slice(0, 40).trimEnd()}${text.length > 40 ? "…" : ""}"`,
  });

async function editingOn(page: Page) {
  await expect(pill(page)).toHaveText("Editing: Off");
  await pill(page).click();
  await expect(pill(page)).toHaveText("Editing: On");
}

async function audit(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
  return violations.flatMap((v) => v.nodes.map((node) => `${v.id}: ${node.target.join(" ")}`));
}

// The raw server HTML. On a protected preview the bypass header goes to the preview only.
const bypass = process.env.PW_BASE_URL ? process.env.VERCEL_AUTOMATION_BYPASS_SECRET : undefined;

test("a visitor's HTML has no edit control (C3)", async ({ request }) => {
  for (const path of ["/", "/services/web-app-development", "/about"]) {
    const response = await request.get(path, {
      headers: bypass ? { "x-vercel-protection-bypass": bypass } : {},
    });
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).not.toContain('aria-label="Edit &quot;');
    expect(html).not.toContain("<dialog");
  }
});

test.describe("with CMS_ENABLED off", () => {
  test.skip(cmsOn, "the CMS is on here");

  test("no ✎ anywhere, even with the hint set", async ({ page }) => {
    await openAsStaff(page, "admin");
    await page.waitForLoadState("networkidle");
    await expect(pencils(page)).toHaveCount(0);
  });
});

test.describe("with the CMS on", () => {
  test.skip(!cmsOn, "needs E2E_CMS=on (a CMS-on build)");

  test("sales staff and a visitor see no ✎", async ({ page, browser }) => {
    await openAsStaff(page, "sales");
    await page.waitForLoadState("networkidle");
    await expect(pencils(page)).toHaveCount(0);

    const visitor = await browser.newPage();
    await visitor.goto("/");
    await visitor.waitForLoadState("networkidle");
    await expect(pencils(visitor)).toHaveCount(0);
    await visitor.close();
  });

  test("an editor gets a ✎ for each block only with editing On", async ({ page }) => {
    await openAsStaff(page, "editor");
    await expect(pill(page)).toBeVisible();
    await expect(pencils(page)).toHaveCount(0);
    await editingOn(page);
    await expect(pencil(page, tagline)).toBeVisible();
    expect(await pencils(page).count()).toBeGreaterThan(10);
    // Every ✎ is at least 24 × 24 px (WCAG 2.2 target size).
    for (const box of await pencils(page).evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect()),
    )) {
      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
    }
    await pill(page).click();
    await expect(pencils(page)).toHaveCount(0);
  });

  test("the dialog opens with the text, closes on Escape and Cancel, and returns focus", async ({
    page,
  }) => {
    await openAsStaff(page, "editor");
    await editingOn(page);
    const button = pencil(page, tagline);

    await button.click();
    const dialog = page.getByRole("dialog", { name: "Edit text" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("textbox", { name: "Text" })).toHaveValue(tagline);
    await expect(dialog.getByRole("textbox", { name: "Text" })).toBeFocused();
    await expect(dialog).toContainText(`${tagline.length} of 120 characters`);
    // One dialog at a time: it is modal, so nothing behind it can open another.
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(button).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(button).toBeFocused();
  });

  test("a refused save keeps the dialog and the draft, and changes nothing", async ({
    page,
    browser,
  }) => {
    await openAsStaff(page, "editor");
    await editingOn(page);
    await pencil(page, tagline).click();
    const dialog = page.getByRole("dialog", { name: "Edit text" });
    const field = dialog.getByRole("textbox", { name: "Text" });
    await field.fill("A draft that must not be lost.");
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(dialog.getByRole("alert")).toHaveText(refused);
    await expect(field).toHaveValue("A draft that must not be lost.");

    const visitor = await browser.newPage();
    await visitor.goto("/");
    await expect(visitor.getByRole("heading", { level: 1 })).toHaveText(tagline);
    await visitor.close();
  });

  test("a body block opens a textarea with a Bold button", async ({ page }) => {
    await openAsStaff(page, "editor", "/about");
    await editingOn(page);
    const story = defaults["about.story.body"];
    await pencil(page, story).click();
    const dialog = page.getByRole("dialog", { name: "Edit text" });
    const field = dialog.getByRole("textbox", { name: "Text" });
    await expect(field).toHaveValue(story);
    await field.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(0, 3));
    await dialog.getByRole("button", { name: "Bold" }).click();
    await expect(field).toHaveValue(`**${story.slice(0, 3)}**${story.slice(3)}`);
    await expect(dialog).toContainText("of 5000 characters");

    // A one-line block has no Bold button.
    await page.keyboard.press("Escape");
    await pencil(page, defaults["about.heading"]).click();
    await expect(dialog.getByRole("button", { name: "Bold" })).toHaveCount(0);
  });

  test("a link's ✎ sits beside it, not inside it (D9)", async ({ page }) => {
    await openAsStaff(page, "editor");
    await editingOn(page);
    const label = defaults["home.cta.button"];
    const inLink = page.getByRole("link").filter({ has: pencil(page, label) });
    await expect(inLink).toHaveCount(0);
    await expect(pencil(page, label).first()).toBeVisible();
  });

  test("axe finds nothing with editing On and with the dialog open", async ({ page }) => {
    await openAsStaff(page, "editor");
    await editingOn(page);
    expect(await audit(page)).toEqual([]);
    await pencil(page, tagline).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await audit(page)).toEqual([]);
  });
});
