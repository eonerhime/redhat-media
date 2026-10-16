import { expect } from "@playwright/test";
import { RECOVER_KEY } from "../app/(dev)/dev/error/throw-once";
import { errorCopy } from "../lib/site";
import { test } from "./portfolio-expect";

// Phase 15 spec, D2 (amended): an error outside the public pages reaches app/error.tsx, which shows
// the branded view with a retry and a plain link home. /dev/error throws once it hydrates.
test.describe("root error boundary", () => {
  test("shows the branded view, and retry recovers", async ({ page }) => {
    const response = await page.goto("/dev/error");
    test.skip(response?.status() === 404, "dev pages are off");
    const view = page.getByTestId("error-view");
    await expect(view.getByRole("heading", { level: 1 })).toHaveText(errorCopy.heading);
    await expect(view.getByText(errorCopy.body)).toBeVisible();
    await expect(view.getByRole("link", { name: errorCopy.home })).toHaveAttribute("href", "/");

    await page.evaluate((key) => sessionStorage.setItem(key, "1"), RECOVER_KEY);
    await view.getByRole("button", { name: errorCopy.retry }).click();
    await expect(page.getByTestId("throw-once")).toHaveText("Recovered");
    await expect(page.getByTestId("error-view")).toHaveCount(0);
  });
});
