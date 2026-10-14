import { describe, expect, it, vi } from "vitest";
import { relatedTo, toCards, type CardRow, type CoverRow, type PortfolioCard } from "./read-core";

// Card mapping and related work (Phase 10 spec, D1, D8, D10).

const row = (id: string, overrides: Partial<CardRow> = {}): CardRow => ({
  id,
  slug: id.replace(/_/g, "-"),
  title: id,
  category: "WEB_APP",
  summary: `${id} summary`,
  techStack: ["TypeScript"],
  liveUrl: `https://${id.replace(/_/g, "-")}.example.com/`,
  featured: false,
  ...overrides,
});

const image = (ownerId: string, sortOrder: number, overrides: Partial<CoverRow> = {}) => ({
  ownerId,
  cloudinaryId: `rhm/portfolio_item/${ownerId}/image_${sortOrder}`,
  alt: `Screenshot ${sortOrder} of ${ownerId}`,
  sortOrder,
  ...overrides,
});

describe("toCards", () => {
  it("keeps the item order and pairs each item with its own cover", () => {
    const cards = toCards([row("b"), row("a"), row("c")], [image("a", 0), image("b", 0)]);
    expect(cards.map((card) => card.id)).toEqual(["b", "a", "c"]);
    expect(cards[0]?.cover).toEqual({
      publicId: "rhm/portfolio_item/b/image_0",
      alt: "Screenshot 0 of b",
    });
    expect(cards[2]?.cover).toBeNull();
  });

  it("picks the lowest-sortOrder image, whatever the row order", () => {
    const [card] = toCards([row("a")], [image("a", 2), image("a", 1)]);
    expect(card?.cover?.publicId).toBe("rhm/portfolio_item/a/image_1");
  });

  it.each([
    ["a full URL", { cloudinaryId: "https://res.cloudinary.com/x/image/upload/rhm/page/a" }],
    ["an ID outside rhm/", { cloudinaryId: "samples/cat" }],
    ["no public ID", { cloudinaryId: null }],
    ["no alt text", { alt: null }],
    ["blank alt text", { alt: "   " }],
  ])("skips an image with %s, with a warning", (_, overrides) => {
    const warn = vi.fn();
    const [alone] = toCards([row("a")], [image("a", 0, overrides)], warn);
    expect(alone?.cover).toBeNull();
    expect(warn).toHaveBeenCalledOnce();

    const [next] = toCards([row("a")], [image("a", 0, overrides), image("a", 1)], warn);
    expect(next?.cover?.publicId).toBe("rhm/portfolio_item/a/image_1");
  });
});

describe("relatedTo", () => {
  const cards: PortfolioCard[] = toCards(
    [
      row("one"),
      row("two", { featured: true }),
      row("photo", { category: "PHOTOGRAPHY", featured: true }),
      row("three"),
      row("four", { featured: true }),
      row("five", { featured: true }),
    ],
    [],
  );

  it("keeps one category, featured first in their order, then the rest, at most three", () => {
    expect(relatedTo(cards, "WEB_APP").map((card) => card.id)).toEqual(["two", "four", "five"]);
    expect(relatedTo(cards, "WEB_APP", 5).map((card) => card.id)).toEqual([
      "two",
      "four",
      "five",
      "one",
      "three",
    ]);
  });

  it("returns nothing for a category with no items", () => {
    expect(relatedTo(cards, "VIDEOGRAPHY")).toEqual([]);
    expect(relatedTo(cards, "PHOTOGRAPHY").map((card) => card.id)).toEqual(["photo"]);
  });
});
