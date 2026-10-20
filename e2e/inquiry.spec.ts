import { expect, test, type Page } from "@playwright/test";
import { defaults } from "../content/defaults";
import { resolveVisibility } from "../lib/content/services";
import { services } from "../content/services";
import { contact } from "../lib/site";

// Phase 18 spec, D13. The form is on wherever INQUIRY_FORM_ENABLED=1 (CI, Vercel Preview) and off
// in production until Phase 20 (D10). E2E_INQUIRY_SUBMIT names what a valid submission shows:
// "success" on the preview (test keys, preview database), "generic" in CI, which has no database.
// One valid submission per run (the keyboard test), within the rate limit (C8).
const formOn = process.env.INQUIRY_FORM_ENABLED === "1";
const expectSuccess = process.env.E2E_INQUIRY_SUBMIT === "success";

const copy = (key: string) => defaults[`contact.form.${key}` as keyof typeof defaults];
const visible = resolveVisibility(services).map((s) => defaults[s.nameKey]);

/** The server refuses a submit under 3 s after hydration (D7), and needs a Turnstile token. */
async function readyToSubmit(page: Page) {
  await page.waitForTimeout(3100);
  await expect(page.locator('input[name="cf-turnstile-response"]')).not.toHaveValue("", {
    timeout: 20_000,
  });
}

test.describe("inquiry form, switched off", () => {
  test.skip(formOn, "the form is on here");

  test("/contact has no form, and /privacy still ships", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("main form")).toHaveCount(0);
    expect((await page.goto("/privacy"))?.status()).toBe(200);
  });
});

test.describe("inquiry form", () => {
  test.skip(!formOn, "INQUIRY_FORM_ENABLED is not 1 here");

  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test("renders after the header with a checkbox per visible service", async ({ page }) => {
    const section = page.getByRole("region", { name: copy("heading") });
    await expect(section).toBeVisible();
    await expect(section.getByRole("group", { name: copy("services.legend") })).toBeVisible();
    const boxes = section.getByRole("checkbox", { name: new RegExp(`^(${visible.join("|")})$`) });
    await expect(boxes).toHaveCount(visible.length);
    for (const label of ["name.label", "email.label", "phone.label", "notes.label"])
      await expect(section.getByLabel(copy(label))).toHaveAttribute("required", "");
    await expect(section.getByRole("link", { name: /privacy notice/ })).toHaveAttribute(
      "href",
      "/privacy",
    );
  });

  test("an empty submit is stopped by the native constraints", async ({ page }) => {
    let posted = false;
    page.on("request", (r) => {
      if (r.method() === "POST") posted = true;
    });
    await page.getByRole("button", { name: copy("submit") }).click();
    const name = page.getByLabel(copy("name.label"));
    expect(await name.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
    await page.waitForTimeout(500);
    expect(posted).toBe(false);
  });

  test("a server-invalid submit shows field errors, focuses the summary and keeps the input", async ({
    page,
  }) => {
    await page.getByLabel(copy("name.label")).fill("E2E Invalid");
    await page.getByLabel(copy("email.label")).fill("e2e@example.com");
    // Passes the browser's checks (type="tel" has no pattern); the schema refuses it.
    await page.getByLabel(copy("phone.label")).fill("12345");
    await page.getByRole("checkbox", { name: visible[0] }).check();
    await page.getByLabel(copy("notes.label")).fill("An end-to-end test of the field errors.");
    await page.getByRole("checkbox", { name: /I agree/ }).check();
    await readyToSubmit(page);
    await page.getByRole("button", { name: copy("submit") }).click();

    const summary = page.getByText(copy("errors.summary"));
    await expect(summary).toBeVisible();
    await expect(page.locator(":focus")).toContainText(copy("errors.summary"));
    const phone = page.getByLabel(copy("phone.label"));
    await expect(phone).toHaveAttribute("aria-invalid", "true");
    await expect(phone).toHaveAccessibleDescription(/country code like \+44 20 7946 0000/);
    await expect(phone).toHaveValue("12345");
    await expect(page.getByLabel(copy("name.label"))).toHaveValue("E2E Invalid");
    await expect(page.getByRole("checkbox", { name: visible[0] })).toBeChecked();
    // The summary links to the field.
    await expect(page.getByRole("link", { name: /Enter a phone number like/ })).toHaveAttribute(
      "href",
      "#inquiry-phone",
    );
  });

  test("the honeypot is neither focusable by Tab nor announced", async ({ page }) => {
    const honeypot = page.locator('input[name="website"]');
    await expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(await honeypot.evaluate((el) => el.closest('[aria-hidden="true"]') !== null)).toBe(true);
    await expect(page.getByRole("textbox", { name: "Website" })).toHaveCount(0);
  });

  test(`can be completed by keyboard alone (${expectSuccess ? "saved" : "no database: generic message"})`, async ({
    page,
  }) => {
    await page.getByLabel(copy("name.label")).focus();
    await page.keyboard.type("E2E Keyboard");
    await page.keyboard.press("Tab");
    await page.keyboard.type("e2e-keyboard@example.com");
    await page.keyboard.press("Tab");
    await page.keyboard.type("0803 123 4567");
    await page.keyboard.press("Tab"); // company (optional)
    await page.keyboard.press("Tab"); // the first service
    await page.keyboard.press("Space");
    for (let i = 0; i < visible.length; i++) await page.keyboard.press("Tab");
    await expect(page.getByLabel(copy("notes.label"))).toBeFocused();
    await page.keyboard.type("Submitted by the Phase 18 keyboard-only end-to-end test.");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("checkbox", { name: /I agree/ })).toBeFocused();
    await page.keyboard.press("Space");

    const submit = page.getByRole("button", { name: copy("submit") });
    for (let i = 0; i < 5 && !(await submit.evaluate((el) => el === document.activeElement)); i++)
      await page.keyboard.press("Tab");
    await expect(submit).toBeFocused();
    await expect(page.getByRole("checkbox", { name: visible[0] })).toBeChecked();

    await readyToSubmit(page);
    await page.keyboard.press("Enter");

    if (expectSuccess) {
      const heading = page.getByRole("heading", { name: copy("success.heading") });
      await expect(heading).toBeFocused({ timeout: 20_000 });
      // Not the copy-email button's live region, which is also a status.
      await expect(
        page.getByRole("status").filter({ hasText: copy("success.heading") }),
      ).toContainText(copy("success.body"));
      await expect(page.locator("main form")).toHaveCount(0);
    } else {
      const message = page.getByText(/^We couldn't send your inquiry/);
      await expect(message).toBeVisible({ timeout: 20_000 });
      await expect(message.getByRole("link", { name: contact.email })).toHaveAttribute(
        "href",
        `mailto:${contact.email}`,
      );
    }
  });
});

test.describe("privacy notice", () => {
  test("has its heading, every section and the contact link", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(defaults["privacy.heading"]);
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(
      ["who", "collect", "why", "basis", "processors", "retention", "rights", "contact"].map(
        (id) => defaults[`privacy.${id}.heading` as keyof typeof defaults],
      ),
    );
    await expect(page.locator("main").getByRole("link", { name: contact.email })).toHaveAttribute(
      "href",
      `mailto:${contact.email}`,
    );
    await expect(
      page.locator("footer").getByRole("link", { name: "Privacy notice" }),
    ).toHaveAttribute("href", "/privacy");
  });
});
