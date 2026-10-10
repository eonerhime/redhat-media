import { expect, test, type Page } from "@playwright/test";
import { services } from "../content/services";
import { resolveVisibility } from "../lib/content/services";
import { contrastRatio, requiredTextRatio } from "../lib/design/contrast";
import { contact, navItems } from "../lib/site";

// Phase 1 "Done when": 360px, 768px and 1440px. The inline nav starts at md (768px).
const widths = [360, 768, 1440] as const;
const MD = 768;
// Every built page gets the layout and contrast checks (Phase 4 spec, D6), including each
// visible service page (Phase 5 spec, D8).
const routes = ["/", "/services", ...resolveVisibility(services).map((s) => `/services/${s.slug}`)];

type TextSample = {
  text: string;
  color: string;
  background: string;
  fontSize: number;
  fontWeight: number;
};

/** Every visible element with its own text, with its colour and the first opaque background behind it. */
function sampleText(page: Page): Promise<TextSample[]> {
  return page.evaluate(() => {
    const opaqueBackground = (start: Element): string => {
      for (let el: Element | null = start; el; el = el.parentElement) {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg !== "transparent" && !/,\s*0\)$|\/\s*0\)$/.test(bg)) return bg;
      }
      return "none";
    };
    const samples: TextSample[] = [];
    for (const el of document.body.querySelectorAll("*")) {
      const ownText = [...el.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent ?? "")
        .join("")
        .trim();
      if (!ownText) continue;
      if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 1 || rect.height <= 1) continue; // sr-only
      const style = getComputedStyle(el);
      samples.push({
        text: ownText.slice(0, 40),
        color: style.color,
        background: opaqueBackground(el),
        fontSize: parseFloat(style.fontSize),
        fontWeight: Number(style.fontWeight),
      });
    }
    return samples;
  });
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

      test("shows the wordmark, nav mode and footer details", async ({ page }) => {
        await expect(page.getByRole("link", { name: "RedHat Media home" })).toBeVisible();

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

      test("every visible text element meets its contrast ratio", async ({ page }) => {
        const samples = await sampleText(page);
        expect(samples.length).toBeGreaterThan(5);
        const failures = samples
          .map((s) => ({
            ...s,
            ratio: s.background === "none" ? 0 : contrastRatio(s.color, s.background),
            required: requiredTextRatio(s.fontSize, s.fontWeight),
          }))
          .filter((s) => s.ratio < s.required);
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
