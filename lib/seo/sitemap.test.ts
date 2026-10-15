import { describe, expect, it } from "vitest";
import { services } from "@/content/services";
import { resolveVisibility } from "@/lib/content/services";
import { robotsRules, sitemapEntries } from "./sitemap";

const siteUrl = "https://redhat-media.vercel.app";

describe("sitemapEntries() (Phase 14 spec, D4)", () => {
  const urls = (input: Parameters<typeof sitemapEntries>[0]) =>
    sitemapEntries(input).map((entry) => entry.url);

  it("lists every public page with absolute URLs", () => {
    expect(
      urls({ siteUrl, serviceSlugs: ["photography"], portfolioSlugs: ["sportspred"] }),
    ).toEqual([
      "https://redhat-media.vercel.app",
      "https://redhat-media.vercel.app/services",
      "https://redhat-media.vercel.app/services/photography",
      "https://redhat-media.vercel.app/about",
      "https://redhat-media.vercel.app/portfolio",
      "https://redhat-media.vercel.app/portfolio/sportspred",
      "https://redhat-media.vercel.app/contact",
    ]);
  });

  it("leaves out a muted service", () => {
    const muted = resolveVisibility(services, { PHOTOGRAPHY: true }).map((s) => s.slug);
    const out = urls({ siteUrl, serviceSlugs: muted, portfolioSlugs: [] });
    expect(out).not.toContain(`${siteUrl}/services/photography`);
    expect(out).toContain(`${siteUrl}/services/videography`);
  });

  it("still lists the other pages when the portfolio read failed", () => {
    expect(urls({ siteUrl, serviceSlugs: [], portfolioSlugs: [] })).toHaveLength(5);
  });

  it("never lists /dev, /cms or a query string", () => {
    const out = urls({ siteUrl, serviceSlugs: ["photography"], portfolioSlugs: ["sportspred"] });
    for (const url of out) expect(url).not.toMatch(/\/dev\/|\/cms|\?/);
  });
});

describe("robotsRules() (D5)", () => {
  it("allows everything, points at the sitemap and disallows nothing", () => {
    expect(robotsRules(siteUrl)).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://redhat-media.vercel.app/sitemap.xml",
    });
  });
});
