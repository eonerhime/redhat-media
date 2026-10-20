import { expect, type Page } from "@playwright/test";
import { defaults } from "../content/defaults";
import { projectTypes } from "../content/project-types";
import { services } from "../content/services";
import { resolveVisibility } from "../lib/content/services";

// Shared by inquiry.spec.ts and a11y.spec.ts: the scope stepper's copy and the clicks that move
// through it (Phase 19 spec, D5, D13).

export const formOn = process.env.INQUIRY_FORM_ENABLED === "1";

export const copy = (key: string) => defaults[`contact.form.${key}` as keyof typeof defaults];

const visibleServices = resolveVisibility(services);

/** The first two visible services, with their names and project-type labels. */
export const [first, second] = visibleServices.slice(0, 2).map((service) => ({
  category: service.category,
  name: defaults[service.nameKey],
  types: projectTypes[service.category].map((type) => defaults[type.labelKey]),
}));

export const visibleNames = visibleServices.map((service) => defaults[service.nameKey]);

export const STEP_NAMES = ["services", "types", "budget", "timeline", "details", "review"].map(
  (step) => copy(`steps.${step}`),
);

/** The step heading, e.g. "Step 3 of 6: What's your budget?" (D8). */
export const stepHeading = (page: Page, n: number) =>
  page.getByRole("heading", { name: `Step ${n} of 6: ${STEP_NAMES[n - 1]}`, exact: true });

/** Only the current step's buttons are in the accessibility tree; the others are `hidden`. */
export const continueButton = (page: Page) =>
  page.getByRole("button", { name: copy("next"), exact: true });
export const backButton = (page: Page) =>
  page.getByRole("button", { name: copy("back"), exact: true });

export async function next(page: Page, toStep: number) {
  await continueButton(page).click();
  await expect(stepHeading(page, toStep)).toBeFocused();
}

export const typeBox = (page: Page, service: string, label: string) =>
  page.getByRole("group", { name: service, exact: true }).getByRole("checkbox", {
    name: label,
    exact: true,
  });

export const budgetLabels = [
  "under500k",
  "from500kTo1500k",
  "from1500kTo5m",
  "from5mTo15m",
  "over15m",
  "notSure",
].map((band) => copy(`budget.${band}`));
export const timelineLabels = [
  "asap",
  "within1Month",
  "oneToThreeMonths",
  "overThreeMonths",
  "flexible",
].map((choice) => copy(`timeline.${choice}`));

export const DETAILS = {
  name: "E2E Stepper",
  email: "e2e-stepper@example.com",
  phone: "0803 123 4567",
  notes: "Filled in by the Phase 19 stepper end-to-end test.",
};

/**
 * Steps 1 to 5 with two services, by clicks, ending on the review (step 6). `onStep(n)` runs as
 * each of steps 1 to 5 opens, before it is filled.
 */
export async function fillToReview(
  page: Page,
  details = DETAILS,
  onStep: (n: number) => Promise<unknown> = async () => {},
) {
  await onStep(1);
  await page.getByRole("checkbox", { name: first.name, exact: true }).check();
  await page.getByRole("checkbox", { name: second.name, exact: true }).check();
  await next(page, 2);
  await onStep(2);
  await typeBox(page, first.name, first.types[0]).check();
  await typeBox(page, first.name, first.types[1]).check();
  await typeBox(page, second.name, second.types.at(-1)!).check();
  await next(page, 3);
  await onStep(3);
  await page.getByRole("radio", { name: budgetLabels[2], exact: true }).check();
  await next(page, 4);
  await onStep(4);
  await page.getByRole("radio", { name: timelineLabels[1], exact: true }).check();
  await next(page, 5);
  await onStep(5);
  await page.getByLabel(copy("name.label"), { exact: true }).fill(details.name);
  await page.getByLabel(copy("email.label"), { exact: true }).fill(details.email);
  await page.getByLabel(copy("phone.label"), { exact: true }).fill(details.phone);
  await page.getByLabel(copy("notes.label"), { exact: true }).fill(details.notes);
  await next(page, 6);
}
