import { expect, type Locator, type Page } from "@playwright/test";
import { defaults } from "../content/defaults";
import { contact } from "../lib/site";
import {
  backButton,
  budgetLabels,
  continueButton,
  copy,
  DETAILS,
  fillToReview,
  first,
  formOn,
  next,
  second,
  stepHeading,
  timelineLabels,
  typeBox,
  visibleNames,
} from "./inquiry-steps";
// Sends the Vercel bypass header to a protected preview (PW_BASE_URL), like the other preview specs.
import { test } from "./portfolio-expect";

// Phase 18 spec, D13; Phase 19 spec, D13. The form is on wherever INQUIRY_FORM_ENABLED=1 (CI,
// Vercel Preview) and off in production until Phase 20. E2E_INQUIRY_SUBMIT names what a valid
// submission shows: "success" on the preview (test keys, preview database), "generic" in CI, which
// has no database. One valid submission per run (the keyboard test), within the rate limit (C5).
const expectSuccess = process.env.E2E_INQUIRY_SUBMIT === "success";

/** The server refuses a submit under 3 s after hydration, and needs a Turnstile token. */
async function readyToSubmit(page: Page) {
  await page.waitForTimeout(3100);
  await expect(page.locator('input[name="cf-turnstile-response"]')).not.toHaveValue("", {
    timeout: 20_000,
  });
}

/** Presses Tab until `target` has focus: keyboard only, without counting stops. */
async function tabTo(page: Page, target: Locator, limit = 30) {
  for (let i = 0; i < limit; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  await expect(target).toBeFocused();
}

/** Continue is refused: the step stays, its summary takes focus and lists `message`. */
async function expectBlocked(page: Page, n: number, message: string | RegExp) {
  await continueButton(page).click();
  await expect(stepHeading(page, n)).toBeVisible();
  const summary = page.locator(":focus");
  await expect(summary).toContainText(copy("errors.summary"));
  await expect(summary.getByRole("link")).toContainText([message]);
}

/** A review group's answer: the first <dd> beside its "Change <label>" button. */
const reviewGroup = (page: Page, label: string) =>
  page
    .locator("dl > div")
    .filter({ has: page.getByRole("button", { name: `Change ${label}`, exact: true }) })
    .getByRole("definition")
    .first();

test.describe("inquiry form, switched off", () => {
  test.skip(formOn, "the form is on here");

  test("/contact has no form, and /privacy still ships", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("main form")).toHaveCount(0);
    expect((await page.goto("/privacy"))?.status()).toBe(200);
  });
});

test.describe("scope stepper", () => {
  test.skip(!formOn, "INQUIRY_FORM_ENABLED is not 1 here");

  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test("opens on step 1 with a checkbox per visible service and the progress list", async ({
    page,
  }) => {
    const section = page.getByRole("region", { name: copy("heading") });
    await expect(stepHeading(page, 1)).toBeVisible();
    await expect(section.getByText("Step 1 of 6", { exact: true })).toBeVisible();
    await expect(section.locator('[aria-current="step"]')).toHaveText(
      `1. ${copy("steps.services")}`,
    );
    await expect(section.getByRole("group", { name: copy("services.legend") })).toBeVisible();
    const boxes = section.getByRole("checkbox", {
      name: new RegExp(`^(${visibleNames.join("|")})$`),
    });
    await expect(boxes).toHaveCount(visibleNames.length);
    // Steps 2 to 6 are in the DOM but hidden (D6); step 1 has Continue only (D5).
    await expect(stepHeading(page, 2)).toBeHidden();
    await expect(backButton(page)).toHaveCount(0);
    await expect(page.getByRole("button", { name: copy("submit") })).toHaveCount(0);
  });

  test("Continue is blocked with a focused summary on every step, and nothing is posted", async ({
    page,
  }) => {
    let posted = false;
    page.on("request", (r) => {
      if (r.method() === "POST") posted = true;
    });

    await expectBlocked(page, 1, "Choose at least one service.");
    await expect(page.getByRole("group", { name: copy("services.legend") })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await page.getByRole("checkbox", { name: first.name, exact: true }).check();
    await page.getByRole("checkbox", { name: second.name, exact: true }).check();
    await next(page, 2);

    // One message per service with no type, naming it (Appendix A).
    await expectBlocked(page, 2, `Choose at least one kind of project for ${first.name}.`);
    await expect(page.locator(":focus").getByRole("link")).toHaveText([
      `Choose at least one kind of project for ${first.name}.`,
      `Choose at least one kind of project for ${second.name}.`,
    ]);
    // "Not sure yet" stands alone in its service (D1).
    await typeBox(page, first.name, first.types[0]).check();
    await typeBox(page, first.name, first.types.at(-1)!).check();
    await expect(typeBox(page, first.name, first.types[0])).not.toBeChecked();
    await typeBox(page, first.name, first.types[1]).check();
    await expect(typeBox(page, first.name, first.types.at(-1)!)).not.toBeChecked();
    await expectBlocked(page, 2, `Choose at least one kind of project for ${second.name}.`);
    await typeBox(page, second.name, second.types[0]).check();
    await next(page, 3);

    await expectBlocked(page, 3, 'Choose a budget range, or "Not sure yet".');
    await page.getByRole("radio", { name: budgetLabels.at(-1)!, exact: true }).check();
    await next(page, 4);

    await expectBlocked(page, 4, 'Choose a timeline, or "Flexible / not sure".');
    await page.getByRole("radio", { name: timelineLabels.at(-1)!, exact: true }).check();
    await next(page, 5);

    await expectBlocked(page, 5, "Enter your name.");
    const phone = page.getByLabel(copy("phone.label"), { exact: true });
    await expect(phone).toHaveAttribute("aria-invalid", "true");
    await expect(phone).toHaveAccessibleDescription(/Enter a phone number we can reach you on/);
    // The summary links to the field.
    await expect(page.getByRole("link", { name: "Enter your name." })).toHaveAttribute(
      "href",
      "#inquiry-clientName",
    );
    await page.getByLabel(copy("name.label"), { exact: true }).fill(DETAILS.name);
    await page.getByLabel(copy("email.label"), { exact: true }).fill(DETAILS.email);
    await phone.fill("12345");
    await page.getByLabel(copy("notes.label"), { exact: true }).fill(DETAILS.notes);
    await expectBlocked(page, 5, /Enter a phone number like 0803 123 4567/);
    await phone.fill(DETAILS.phone);
    await next(page, 6);

    // The last step checks consent before sending.
    await page.getByRole("button", { name: copy("submit") }).click();
    await expect(page.locator(":focus")).toContainText(
      "Please agree to the privacy notice so we can keep your details.",
    );
    await page.waitForTimeout(300);
    expect(posted).toBe(false);
  });

  test("answers are kept through the in-form Back, browser Back and Forward", async ({ page }) => {
    await fillToReview(page);
    await backButton(page).click();
    await expect(stepHeading(page, 5)).toBeFocused();
    await expect(page.getByLabel(copy("name.label"), { exact: true })).toHaveValue(DETAILS.name);

    await page.goBack();
    await expect(stepHeading(page, 4)).toBeFocused();
    await expect(page.getByRole("radio", { name: timelineLabels[1], exact: true })).toBeChecked();
    await page.goBack();
    await page.goBack();
    await expect(stepHeading(page, 2)).toBeFocused();
    await expect(typeBox(page, first.name, first.types[1])).toBeChecked();
    await expect(typeBox(page, second.name, second.types.at(-1)!)).toBeChecked();
    await page.goBack();
    await expect(stepHeading(page, 1)).toBeFocused();
    await expect(page.getByRole("checkbox", { name: second.name, exact: true })).toBeChecked();
    // Still /contact: no URL per step (C2).
    expect(new URL(page.url()).pathname).toBe("/contact");

    await page.goForward();
    await expect(stepHeading(page, 2)).toBeFocused();
    await expect(page.locator('[aria-current="step"]')).toHaveText(`2. ${copy("steps.types")}`);
  });

  test("the review lists every answer; Change returns to a step, and an unticked service drops its types", async ({
    page,
  }) => {
    await fillToReview(page);
    await expect(reviewGroup(page, copy("review.services"))).toHaveText(
      `${first.name}, ${second.name}`,
    );
    await expect(reviewGroup(page, copy("review.types")).getByRole("listitem")).toHaveText([
      `${first.name}: ${first.types[0]}, ${first.types[1]}`,
      `${second.name}: ${second.types.at(-1)}`,
    ]);
    await expect(reviewGroup(page, copy("review.budget"))).toHaveText(budgetLabels[2]);
    await expect(reviewGroup(page, copy("review.timeline"))).toHaveText(timelineLabels[1]);
    await expect(reviewGroup(page, copy("review.details"))).toContainText(DETAILS.email);

    await page.getByRole("button", { name: `Change ${copy("review.budget")}` }).click();
    await expect(stepHeading(page, 3)).toBeFocused();
    await page.getByRole("radio", { name: budgetLabels[0], exact: true }).check();
    await next(page, 4);
    await next(page, 5);
    await next(page, 6);
    await expect(reviewGroup(page, copy("review.budget"))).toHaveText(budgetLabels[0]);

    await page.getByRole("button", { name: `Change ${copy("review.services")}` }).click();
    await expect(stepHeading(page, 1)).toBeFocused();
    await page.getByRole("checkbox", { name: second.name, exact: true }).uncheck();
    await next(page, 2);
    await expect(page.getByRole("group", { name: second.name, exact: true })).toBeHidden();
    for (const n of [3, 4, 5, 6]) await next(page, n);
    await expect(reviewGroup(page, copy("review.services"))).toHaveText(first.name);
    await expect(reviewGroup(page, copy("review.types")).getByRole("listitem")).toHaveText([
      `${first.name}: ${first.types[0]}, ${first.types[1]}`,
    ]);
    // Ticking it again restores its types (D6).
    await page.getByRole("button", { name: `Change ${copy("review.services")}` }).click();
    await page.getByRole("checkbox", { name: second.name, exact: true }).check();
    await next(page, 2);
    await expect(typeBox(page, second.name, second.types.at(-1)!)).toBeChecked();
  });

  test("a server-invalid submit opens the first step with an error and keeps every answer", async ({
    page,
  }) => {
    // Passes the browser's type="email" check; the schema wants a domain with a dot.
    await fillToReview(page, { ...DETAILS, email: "e2e-invalid@example" });
    await page.getByRole("checkbox", { name: /I agree/ }).check();
    await readyToSubmit(page);
    await page.getByRole("button", { name: copy("submit") }).click();

    await expect(stepHeading(page, 5)).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(":focus")).toContainText(copy("errors.summary"));
    const email = page.getByLabel(copy("email.label"), { exact: true });
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(email).toHaveValue("e2e-invalid@example");
    await expect(
      page.getByRole("link", { name: "Enter a valid email address, like name@example.com." }),
    ).toHaveAttribute("href", "#inquiry-email");
    // Back returns to the review, with the earlier answers kept.
    await backButton(page).click();
    await expect(stepHeading(page, 6)).toBeFocused();
    await expect(reviewGroup(page, copy("review.budget"))).toHaveText(budgetLabels[2]);
  });

  test("the honeypot is neither focusable by Tab nor announced", async ({ page }) => {
    const honeypot = page.locator('input[name="website"]');
    await expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(await honeypot.evaluate((el) => el.closest('[aria-hidden="true"]') !== null)).toBe(true);
    await expect(page.getByRole("textbox", { name: "Website" })).toHaveCount(0);
  });

  test(`can be completed by keyboard alone, with two services (${expectSuccess ? "saved" : "no database: generic message"})`, async ({
    page,
  }) => {
    const press = (key: string) => page.keyboard.press(key);

    // Step 1: two services.
    await page.getByRole("checkbox", { name: first.name, exact: true }).focus();
    await press("Space");
    await press("Tab");
    await expect(page.getByRole("checkbox", { name: second.name, exact: true })).toBeFocused();
    await press("Space");
    await tabTo(page, continueButton(page));
    await press("Enter");

    // Step 2: a type for each; focus starts on the heading.
    await expect(stepHeading(page, 2)).toBeFocused();
    await tabTo(page, typeBox(page, first.name, first.types[0]));
    await press("Space");
    await tabTo(page, typeBox(page, second.name, second.types[0]));
    await press("Space");
    await tabTo(page, continueButton(page));
    await press("Enter");

    // Steps 3 and 4: radios take an arrow key.
    for (const [n, labels] of [
      [3, budgetLabels],
      [4, timelineLabels],
    ] as const) {
      await expect(stepHeading(page, n)).toBeFocused();
      await press("Tab");
      await press("ArrowDown");
      await expect(page.getByRole("radio", { name: labels[1], exact: true })).toBeChecked();
      await tabTo(page, continueButton(page));
      await press("Enter");
    }

    // Step 5: Enter in a field means Continue, not Send.
    await expect(stepHeading(page, 5)).toBeFocused();
    await press("Tab");
    await page.keyboard.type("E2E Keyboard");
    await press("Tab");
    await page.keyboard.type("e2e-keyboard@example.com");
    await press("Tab");
    await page.keyboard.type("0803 123 4567");
    await press("Tab"); // company (optional)
    await press("Tab");
    await expect(page.getByLabel(copy("notes.label"), { exact: true })).toBeFocused();
    await page.keyboard.type("Submitted by the Phase 19 keyboard-only end-to-end test.");
    await page.getByLabel(copy("email.label"), { exact: true }).focus();
    await press("Enter");

    // Step 6: check, agree, send.
    await expect(stepHeading(page, 6)).toBeFocused();
    await expect(page.getByRole("definition").filter({ hasText: second.types[0] })).toBeVisible();
    await tabTo(page, page.getByRole("checkbox", { name: /I agree/ }));
    await press("Space");
    const submit = page.getByRole("button", { name: copy("submit") });
    await tabTo(page, submit);
    await readyToSubmit(page);
    await press("Enter");

    if (expectSuccess) {
      const heading = page.getByRole("heading", { name: copy("success.heading") });
      await expect(heading).toBeFocused({ timeout: 20_000 });
      // Not the copy-email button's live region, which is also a status.
      await expect(
        page.getByRole("status").filter({ hasText: copy("success.heading") }),
      ).toContainText(copy("success.body"));
      await expect(page.locator("main form")).toHaveCount(0);
      // After success, browser Back leaves the panel in place (D7).
      await page.goBack();
      await expect(heading).toBeVisible();
    } else {
      const message = page.getByText(/^We couldn't send your inquiry/);
      await expect(message).toBeVisible({ timeout: 20_000 });
      await expect(page.locator(":focus")).toContainText("We couldn't send your inquiry");
      await expect(message.getByRole("link", { name: contact.email })).toHaveAttribute(
        "href",
        `mailto:${contact.email}`,
      );
      // A failed send keeps every answer (D6).
      await expect(page.getByRole("checkbox", { name: /I agree/ })).toBeChecked();
      await expect(page.getByRole("definition").filter({ hasText: "E2E Keyboard" })).toBeVisible();
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
