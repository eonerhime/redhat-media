import type { Locator, Page } from "@playwright/test";
import { contrastRatio, requiredTextRatio } from "../lib/design/contrast";

type TextSample = {
  text: string;
  color: string;
  background: string;
  fontSize: number;
  fontWeight: number;
};

/**
 * Every visible element with its own text inside `within` (default: the body), with its colour and
 * the first opaque background behind it.
 */
function sampleText(page: Page, within?: Locator): Promise<TextSample[]> {
  const sample = (root: Element) => {
    const opaqueBackground = (start: Element): string => {
      for (let el: Element | null = start; el; el = el.parentElement) {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg !== "transparent" && !/,\s*0\)$|\/\s*0\)$/.test(bg)) return bg;
      }
      return "none";
    };
    const samples: TextSample[] = [];
    for (const el of root.querySelectorAll("*")) {
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
  };
  // Passed whole to the browser, so `sample` must not use anything from this module's scope.
  return (within ?? page.locator("body")).evaluate(sample);
}

/** The visible text samples, and those that miss their WCAG ratio; the caller expects none. */
export async function contrastFailures(page: Page, within?: Locator) {
  const samples = await sampleText(page, within);
  return {
    count: samples.length,
    failures: samples
      .map((s) => ({
        ...s,
        ratio: s.background === "none" ? 0 : contrastRatio(s.color, s.background),
        required: requiredTextRatio(s.fontSize, s.fontWeight),
      }))
      .filter((s) => s.ratio < s.required),
  };
}
