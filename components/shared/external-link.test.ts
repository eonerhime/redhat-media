import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExternalLink } from "./external-link";

// Phase 9 spec, D4. A .ts file, because the unit suite collects *.test.ts only;
// ExternalLink has no hooks, so it can be called as a plain function.
const render = (href: string) =>
  renderToStaticMarkup(ExternalLink({ href, className: "c", children: "Live site" }));

afterEach(() => vi.restoreAllMocks());

describe("<ExternalLink>", () => {
  it("renders an https link in a new tab with noopener noreferrer", () => {
    expect(render("https://sportspred.ng/")).toBe(
      '<a href="https://sportspred.ng/" target="_blank" rel="noopener noreferrer" class="c">Live site<span class="sr-only"> (opens in a new tab)</span></a>',
    );
  });

  it.each(["http://example.com", "javascript:alert(1)", "//example.com", "https://localhost/"])(
    "renders %s as plain text, never a link",
    (href) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const html = render(href);
      expect(html).toBe('<span class="c">Live site</span>');
      expect(html).not.toContain("href");
      expect(warn).toHaveBeenCalledOnce();
    },
  );
});
