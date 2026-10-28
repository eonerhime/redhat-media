import { expect, test, type Page } from "@playwright/test";
import { contact, navItems } from "../lib/site";
import { contrastFailures } from "./contrast";
import { pinnedState } from "./portfolio-expect";
import { routes } from "./routes";

// Phase 1 "Done when": 360px, 768px and 1440px. The inline nav starts at md (768px).
const widths = [360, 768, 1440] as const;
const MD = 768;

/** Scrolls to the bottom and returns the header's top edge relative to the viewport. */
async function headerTopAfterScroll(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  return page.getByRole("banner").evaluate((el) => el.getBoundingClientRect().top);
}

for (const route of routes)
  for (const width of widths) {
    test.describe(`${route} at ${width}px`, () => {
      test.use({ viewport: { width, height: 900 } });

      test.beforeEach(async ({ page }) => {
        await page.goto(route);
      });

      test("has no horizontal overflow", async ({ page }) => {
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBe(0);
      });

      test("shows the logo, nav mode and footer details", async ({ page }) => {
        // The owner's logo, not a CSS wordmark (Phase 1 spec, D1 as amended 2026-10-14).
        const logo = page.getByRole("link", { name: "RedHat Media home" }).getByRole("img");
        await expect(logo).toBeVisible();
        await expect(logo).not.toHaveAttribute("loading", "lazy");
        await expect
          .poll(() => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
          .toBeGreaterThan(0);

        const menuButton = page.getByRole("button", { name: "Menu" });
        const nav = page.getByRole("navigation", { name: "Main" });
        if (width >= MD) {
          await expect(menuButton).toBeHidden();
          await expect(nav.getByRole("link")).toHaveText(navItems.map((item) => item.label));
        } else {
          await expect(menuButton).toBeVisible();
          await expect(nav).toHaveCount(0);
        }

        const footer = page.getByRole("contentinfo");
        await expect(footer.getByRole("link", { name: contact.email })).toHaveAttribute(
          "href",
          `mailto:${contact.email}`,
        );
        await expect(footer.getByRole("link", { name: contact.phoneDisplay })).toHaveAttribute(
          "href",
          contact.phoneHref,
        );
        await expect(footer).toContainText(contact.location);
        await expect(footer).toContainText(
          `${contact.registration} · © ${new Date().getFullYear()} RedHat Media`,
        );
      });

      test("keeps the header at the top after scrolling", async ({ page }) => {
        // A page shorter than the viewport has nothing to scroll, e.g. a portfolio item while the
        // portfolio is unavailable (Phase 12 spec, D3). Where the portfolio is up, every page
        // scrolls once its streamed content is in, so wait for that instead of deciding to skip
        // before it arrives (Phase 27 spec, D11).
        const scrolls = () =>
          page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight);
        if (pinnedState === "ready") await expect.poll(scrolls).toBe(true);
        test.skip(!(await scrolls()), "the page does not scroll at this size");
        expect(await headerTopAfterScroll(page)).toBe(0);
        await expect(page.getByRole("link", { name: "RedHat Media home" })).toBeInViewport();
      });

      test("every visible text element meets its contrast ratio", async ({ page }) => {
        const { count, failures } = await contrastFailures(page);
        expect(count).toBeGreaterThan(5);
        expect(failures).toEqual([]);
      });
    });
  }

test.describe("mobile nav", () => {
  test.use({ viewport: { width: 360, height: 900 } });

  test("opens, closes on Escape and returns focus", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("button", { name: "Menu" });
    const nav = page.getByRole("navigation", { name: "Main" });

    await expect(button).toHaveAttribute("aria-expanded", "false");
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(nav.getByRole("link")).toHaveText(navItems.map((item) => item.label));

    await page.keyboard.press("Escape");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(nav).toHaveCount(0);
    await expect(button).toBeFocused();
  });

  test("opens in view after scrolling (Phase 6 spec, D10)", async ({ page }) => {
    await page.goto("/");
    expect(await headerTopAfterScroll(page)).toBe(0);
    await page.getByRole("button", { name: "Menu" }).click();
    const links = page.getByRole("navigation", { name: "Main" }).getByRole("link");
    for (const item of navItems)
      await expect(links.filter({ hasText: item.label })).toBeInViewport();
  });

  test("closes when a link is followed", async ({ page }) => {
    await page.goto("/");
    // The nav targets 404 until their phases land, so stop the navigation and check only the close.
    await page.evaluate(() =>
      document.addEventListener("click", (event) => event.preventDefault(), { capture: true }),
    );
    const button = page.getByRole("button", { name: "Menu" });
    await button.click();
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "About" })
      .click();
    await expect(button).toHaveAttribute("aria-expanded", "false");
  });
});

/** Longest computed transition or animation duration on the page, in seconds, per element. */
function longestMotion(page: Page) {
  return page.evaluate(() => {
    const seconds = (value: string) =>
      value.split(",").map((part) => {
        const n = parseFloat(part);
        return part.trim().endsWith("ms") ? n / 1000 : n;
      });
    return [...document.querySelectorAll("*")].map((el) => {
      const style = getComputedStyle(el);
      return {
        element: `${el.tagName.toLowerCase()}.${el.getAttribute("class") ?? ""}`.slice(0, 80),
        duration: Math.max(
          ...seconds(style.transitionDuration),
          ...seconds(style.animationDuration),
        ),
      };
    });
  });
}

test.describe("reduced motion", () => {
  test.use({ viewport: { width: 360, height: 900 } });

  test("prefers-reduced-motion disables motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    const moving = (await longestMotion(page)).filter((m) => m.duration > 0.0001);
    expect(moving).toEqual([]);
  });

  test("control: the shell has motion when reduced motion is not requested", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    const moving = (await longestMotion(page)).filter((m) => m.duration > 0.0001);
    expect(moving.length).toBeGreaterThan(0);
  });
});
