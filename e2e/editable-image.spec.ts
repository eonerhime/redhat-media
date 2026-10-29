import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type Route } from "@playwright/test";
import { test, withBypass } from "./portfolio-expect";

// The image ✎ and its dialog (Phase 28 spec, D3, D5, D13; validation.md).
//
// E2E_CMS=on (preview-e2e): /api/cms/session is answered with page.route(), as in
// editable.spec.ts, so the ✎ appears for a mocked editor. api.cloudinary.com is stubbed, so CI
// never uploads. The save reaches the real actions, which refuse it: the mocked editor has no real
// session. That is the failure path (the dialog keeps the draft and shows the error); a real
// upload is the owner's preview check, and the writes are attach-core.db.test.ts. Otherwise (the
// ci job, CMS off): no ✎.

const cmsOn = process.env.E2E_CMS === "on";
const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const refused = "You can't edit this. Sign in again as an editor.";
const badFile = "Use a JPEG, PNG, WebP or AVIF image of 15 MB or less.";

// A 1 × 1 transparent PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

type Role = "sales" | "editor" | "admin";

/** Opens `path` as signed-in staff (the sign-in hint set), with editing Off. */
async function openAsStaff(page: Page, role: Role, path = "/") {
  await page.route("**/api/cms/session", (route: Route) =>
    route.fulfill({
      status: 200,
      headers: { "cache-control": "no-store" },
      json: { role, authenticated: true },
    }),
  );
  await page.addInitScript(() => localStorage.setItem("rhm:staff", "1"));
  await page.goto(path);
}

/** Stubs Cloudinary's upload API and counts what reaches it (D13). */
async function stubCloudinary(page: Page) {
  const calls: string[] = [];
  await page.route("https://api.cloudinary.com/**", (route: Route) => {
    calls.push(route.request().url());
    return route.fulfill({ status: 200, json: { public_id: "stub" } });
  });
  return calls;
}

/** Server-action calls (POSTs with a Next-Action header), not analytics beacons. */
function countPosts(page: Page) {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.headers()["next-action"]) posts.push(request.url());
  });
  return posts;
}

const pill = (page: Page) => page.getByRole("button", { name: /^Editing: (On|Off)$/ });
const imagePencil = (page: Page) => page.getByRole("button", { name: /^Edit image: "/ });
const heroImage = (page: Page) => page.locator("main section").first().getByRole("img");

async function editingOn(page: Page) {
  await expect(pill(page)).toHaveText("Editing: Off");
  await pill(page).click();
  await expect(pill(page)).toHaveText("Editing: On");
}

async function openDialog(page: Page) {
  await imagePencil(page).click();
  const dialog = page.getByRole("dialog", { name: "Edit image" });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function audit(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
  return violations.flatMap((v) => v.nodes.map((node) => `${v.id}: ${node.target.join(" ")}`));
}

const bypass = process.env.PW_BASE_URL ? process.env.VERCEL_AUTOMATION_BYPASS_SECRET : undefined;

test("a visitor's HTML has no image ✎ or dialog (C3)", async ({ request }) => {
  const response = await request.get("/", {
    headers: bypass ? { "x-vercel-protection-bypass": bypass } : {},
  });
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).not.toContain("Edit image:");
  expect(html).not.toContain("<dialog");
});

test.describe("with CMS_ENABLED off", () => {
  test.skip(cmsOn, "the CMS is on here");

  test("no image ✎, even with the hint set", async ({ page }) => {
    await openAsStaff(page, "admin");
    await page.waitForLoadState("networkidle");
    await expect(imagePencil(page)).toHaveCount(0);
  });
});

test.describe("with the CMS on", () => {
  test.skip(!cmsOn, "needs E2E_CMS=on (a CMS-on build)");

  test("sales staff and a visitor see no image ✎", async ({ page, browser }) => {
    await openAsStaff(page, "sales");
    await page.waitForLoadState("networkidle");
    await expect(imagePencil(page)).toHaveCount(0);

    const visitor = await withBypass(await browser.newPage());
    await visitor.goto("/");
    await visitor.waitForLoadState("networkidle");
    await expect(imagePencil(visitor)).toHaveCount(0);
    await visitor.close();
  });

  test("an editor gets the ✎ on the image's corner only with editing On", async ({ page }) => {
    await openAsStaff(page, "editor");
    await expect(pill(page)).toBeVisible();
    await expect(imagePencil(page)).toHaveCount(0);
    await editingOn(page);
    await expect(imagePencil(page)).toHaveCount(1);

    const button = await imagePencil(page).boundingBox();
    const image = await heroImage(page).boundingBox();
    if (!button || !image) throw new Error("expected the ✎ and the image to be laid out");
    // At least 24 × 24 (WCAG 2.2 target size), inside the image's top-right corner (D3).
    expect(button.width).toBeGreaterThanOrEqual(24);
    expect(button.height).toBeGreaterThanOrEqual(24);
    expect(button.x).toBeGreaterThanOrEqual(image.x);
    expect(button.y).toBeGreaterThanOrEqual(image.y);
    expect(button.x + button.width).toBeLessThanOrEqual(image.x + image.width);
    expect(button.y + button.height).toBeLessThanOrEqual(image.y + image.height / 4);

    await pill(page).click();
    await expect(imagePencil(page)).toHaveCount(0);
  });

  test("the dialog shows the image and its alt text, closes on Escape and Cancel, and returns focus", async ({
    page,
  }) => {
    await openAsStaff(page, "editor");
    await editingOn(page);
    const alt = (await heroImage(page).getAttribute("alt")) ?? "";
    const dialog = await openDialog(page);

    await expect(dialog.getByText("Current image")).toBeVisible();
    await expect(dialog.getByRole("img", { name: alt })).toBeVisible();
    await expect(dialog.getByLabel("Replace with a new image")).toBeFocused();
    await expect(dialog.getByRole("textbox", { name: "Alt text" })).toHaveValue(alt);
    await expect(dialog).toContainText(`${alt.length} of 150 characters`);
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(imagePencil(page)).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(imagePencil(page)).toBeFocused();
  });

  test("alt text is required and counted, refused before any request", async ({ page }) => {
    const calls = await stubCloudinary(page);
    await openAsStaff(page, "editor");
    await editingOn(page);
    const posts = countPosts(page);
    const dialog = await openDialog(page);
    const field = dialog.getByRole("textbox", { name: "Alt text" });

    await field.fill("   ");
    await expect(dialog).toContainText("0 of 150 characters");
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(dialog.getByRole("alert")).toHaveText("Describe the image in the alt text.");

    await field.fill("a".repeat(151));
    await expect(dialog).toContainText("151 of 150 characters");
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(dialog.getByRole("alert")).toHaveText(
      "Keep the alt text to 150 characters or fewer.",
    );
    expect(posts).toEqual([]);
    expect(calls).toEqual([]);
  });

  test("a 16 MB file and a HEIC file are refused in the dialog before any request", async ({
    page,
  }) => {
    const calls = await stubCloudinary(page);
    await openAsStaff(page, "editor");
    await editingOn(page);
    const posts = countPosts(page);
    const dialog = await openDialog(page);
    const input = dialog.getByLabel("Replace with a new image");

    await input.setInputFiles({
      name: "huge.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.alloc(16 * 1024 * 1024),
    });
    await expect(dialog.getByRole("alert")).toHaveText(badFile);
    await expect(dialog).not.toContainText("Chosen:");

    await input.setInputFiles({ name: "phone.heic", mimeType: "image/heic", buffer: PNG });
    await expect(dialog.getByRole("alert")).toHaveText(badFile);

    await input.setInputFiles({ name: "ok.png", mimeType: "image/png", buffer: PNG });
    await expect(dialog.getByRole("alert")).toHaveCount(0);
    await expect(dialog).toContainText("Chosen: ok.png (1 KB)");
    expect(posts).toEqual([]);
    expect(calls).toEqual([]);
  });

  test("a refused save keeps the dialog and the draft, uploads nothing and changes nothing", async ({
    page,
    browser,
  }) => {
    const calls = await stubCloudinary(page);
    await openAsStaff(page, "editor");
    await editingOn(page);
    const before = await heroImage(page).getAttribute("src");
    const dialog = await openDialog(page);
    const field = dialog.getByRole("textbox", { name: "Alt text" });

    // A new file: refused at signing, before anything reaches Cloudinary.
    await dialog
      .getByLabel("Replace with a new image")
      .setInputFiles({ name: "ok.png", mimeType: "image/png", buffer: PNG });
    await field.fill("A draft that must not be lost");
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(dialog.getByRole("alert")).toHaveText(refused);
    await expect(field).toHaveValue("A draft that must not be lost");
    await expect(dialog).toContainText("Chosen: ok.png");
    expect(calls).toEqual([]);

    // Alt text alone: refused by attachMedia.
    await dialog.getByLabel("Replace with a new image").setInputFiles([]);
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(dialog.getByRole("alert")).toHaveText(refused);

    const visitor = await withBypass(await browser.newPage());
    await visitor.goto("/");
    expect(await heroImage(visitor).getAttribute("src")).toBe(before);
    await visitor.close();
  });

  test("turning editing On moves nothing around the image", async ({ page }) => {
    for (const width of [1440, 360]) {
      await page.setViewportSize({ width, height: 900 });
      await openAsStaff(page, "editor");
      await expect(pill(page)).toHaveText("Editing: Off");
      const before = await heroImage(page).boundingBox();
      await editingOn(page);
      await expect(imagePencil(page)).toBeVisible();
      expect(await heroImage(page).boundingBox(), `at ${width}px`).toEqual(before);
      await pill(page).click();
    }
  });

  test("axe finds nothing with editing On and with the dialog open", async ({ page }) => {
    await openAsStaff(page, "editor");
    await editingOn(page);
    expect(await audit(page)).toEqual([]);
    await openDialog(page);
    expect(await audit(page)).toEqual([]);
  });
});
