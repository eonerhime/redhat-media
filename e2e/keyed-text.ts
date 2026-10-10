import { expect, type Page } from "@playwright/test";
import { defaults } from "../content/defaults";

// "Every text string is keyed" (Phase 3 spec, D8; Phase 4 spec, D5): each visible text node in
// <main>, leaving out aria-hidden decoration, must equal a value in content/defaults.ts.
export async function expectOnlyKeyedText(page: Page) {
  const texts = await page.locator("main").evaluate((main) => {
    const found: string[] = [];
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
      const parent = node.parentElement;
      if (!text || !parent || parent.closest('[aria-hidden="true"]')) continue;
      found.push(text);
    }
    return found;
  });
  const values = new Set<string>(Object.values(defaults));
  expect(texts.length).toBeGreaterThan(0);
  expect(texts.filter((text) => !values.has(text))).toEqual([]);
}
