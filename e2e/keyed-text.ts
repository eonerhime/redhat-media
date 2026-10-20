import { expect, type Page } from "@playwright/test";
import { defaults } from "../content/defaults";

// "Every text string is keyed" (Phase 3 spec, D8; Phase 4 spec, D5): each visible text node in
// <main>, leaving out aria-hidden decoration, must equal a value in content/defaults.ts.
// <script> contents (JSON-LD) are data, not visible text (Phase 5 spec, D8); nor is <noscript>,
// which is raw text when scripts run (Phase 19 spec, D11). `siteValues` names
// the lib/site.ts values a page may show besides copy, such as the facts on /about (Phase 6 spec, D9).
export async function expectOnlyKeyedText(page: Page, siteValues: readonly string[] = []) {
  const texts = await page.locator("main").evaluate((main) => {
    const found: string[] = [];
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
      const parent = node.parentElement;
      if (!text || !parent || parent.closest('[aria-hidden="true"], script, noscript')) continue;
      found.push(text);
    }
    return found;
  });
  const values = new Set<string>([...Object.values(defaults), ...siteValues]);
  expect(texts.length).toBeGreaterThan(0);
  expect(texts.filter((text) => !values.has(text))).toEqual([]);
}
