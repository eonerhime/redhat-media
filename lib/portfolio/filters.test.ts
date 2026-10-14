import { describe, expect, it } from "vitest";
import { serviceCategories, type ServiceCategory } from "@/content/services";
import {
  ALL,
  applyFilter,
  filterForCategory,
  filterHref,
  parseFilter,
  portfolioFilters,
  resolveFilter,
  visibleFilters,
} from "./filters";

// The category filters (Phase 11 spec, D1, D3, D9).

const card = (id: string, category: ServiceCategory) => ({ id, category });
const slugs = (filters: readonly { slug: string | null }[]) => filters.map((f) => f.slug);

describe("portfolioFilters", () => {
  it("lists All, then the README's four tabs, in order", () => {
    expect(slugs(portfolioFilters)).toEqual([
      null,
      "web-apps",
      "photography",
      "videography",
      "marketing",
    ]);
  });

  it("puts every category in exactly one filter besides All", () => {
    for (const category of serviceCategories) {
      const holders = portfolioFilters.filter((f) =>
        (f.categories as readonly string[]).includes(category),
      );
      expect(holders, category).toHaveLength(1);
    }
    const listed = portfolioFilters.flatMap((f) => f.categories);
    expect(listed.toSorted()).toEqual([...serviceCategories].sort());
  });

  it("groups the three Growth services under Marketing", () => {
    expect(filterForCategory("DIGITAL_MARKETING").slug).toBe("marketing");
    expect(filterForCategory("SOCIAL_MEDIA").slug).toBe("marketing");
    expect(filterForCategory("ONLINE_PRESENCE").slug).toBe("marketing");
  });
});

describe("parseFilter", () => {
  it("accepts each exact slug", () => {
    for (const filter of portfolioFilters) {
      if (filter.slug) expect(parseFilter(filter.slug)).toBe(filter);
    }
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["unknown", "nope"],
    ["wrongly cased", "Web-Apps"],
    ["padded", " web-apps"],
    ["repeated", ["web-apps", "photography"]],
    ["repeated once", ["web-apps"]],
  ])("gives All for a %s value", (_, value) => {
    expect(parseFilter(value)).toBe(ALL);
  });
});

describe("visibleFilters", () => {
  it("keeps All and only the filters that have cards", () => {
    expect(slugs(visibleFilters([card("a", "WEB_APP"), card("b", "WEB_APP")]))).toEqual([
      null,
      "web-apps",
    ]);
  });

  it("shows Marketing for any one of its categories, and keeps display order", () => {
    expect(slugs(visibleFilters([card("a", "ONLINE_PRESENCE"), card("b", "PHOTOGRAPHY")]))).toEqual(
      [null, "photography", "marketing"],
    );
  });

  it("gives only All when there are no cards", () => {
    expect(visibleFilters([])).toEqual([ALL]);
  });
});

describe("applyFilter", () => {
  const cards = [
    card("a", "PHOTOGRAPHY"),
    card("b", "WEB_APP"),
    card("c", "SOCIAL_MEDIA"),
    card("d", "WEB_APP"),
  ];

  it("keeps every card, in order, for All", () => {
    expect(applyFilter(cards, ALL)).toEqual(cards);
  });

  it("keeps only the filter's categories, in the given order", () => {
    expect(applyFilter(cards, parseFilter("web-apps")).map((c) => c.id)).toEqual(["b", "d"]);
    expect(applyFilter(cards, parseFilter("marketing")).map((c) => c.id)).toEqual(["c"]);
  });
});

describe("resolveFilter", () => {
  const cards = [card("a", "WEB_APP")];

  it("keeps a requested filter that has cards", () => {
    expect(resolveFilter(cards, parseFilter("web-apps")).current.slug).toBe("web-apps");
  });

  it("falls back to All for a filter with no cards", () => {
    const { filters, current } = resolveFilter(cards, parseFilter("photography"));
    expect(current).toBe(ALL);
    expect(slugs(filters)).toEqual([null, "web-apps"]);
  });
});

describe("filterHref and filterForCategory", () => {
  it("links All to /portfolio, with no parameter", () => {
    expect(filterHref(ALL)).toBe("/portfolio");
  });

  it("round-trips every category through its URL", () => {
    for (const category of serviceCategories) {
      const href = filterHref(filterForCategory(category));
      const value = new URL(href, "https://example.com").searchParams.get("category") ?? undefined;
      expect(parseFilter(value).categories as readonly string[]).toContain(category);
    }
  });
});
