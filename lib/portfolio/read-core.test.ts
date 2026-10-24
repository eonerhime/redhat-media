import { describe, expect, it, vi } from "vitest";
import {
  detailParams,
  featuredCards,
  NO_SLUG,
  relatedTo,
  toCards,
  toHeroAndGallery,
  type CardRow,
  type CoverRow,
  type MediaRow,
  type PortfolioCard,
} from "./read-core";
import { SLUG } from "./schema";

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

describe("featuredCards", () => {
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

  // Phase 23 spec, D1: featured only, in portfolio order, any category, at most three.
  it("keeps featured cards in their order, at most three", () => {
    expect(featuredCards(cards).map((card) => card.id)).toEqual(["two", "photo", "four"]);
    expect(featuredCards(cards, 10).map((card) => card.id)).toEqual([
      "two",
      "photo",
      "four",
      "five",
    ]);
  });

  it("returns nothing when no card is featured, or there are no cards", () => {
    expect(featuredCards(cards.map((card) => ({ ...card, featured: false })))).toEqual([]);
    expect(featuredCards([])).toEqual([]);
  });
});

// Detail reads (Phase 12 spec, D1, D2).

const media = (id: string, sortOrder: number, overrides: Partial<MediaRow> = {}): MediaRow => ({
  id,
  kind: "IMAGE",
  cloudinaryId: `rhm/portfolio_item/a/${id}`,
  alt: `Alt ${id}`,
  caption: null,
  title: null,
  videoProvider: null,
  videoId: null,
  sortOrder,
  ...overrides,
});

const video = (id: string, sortOrder: number, overrides: Partial<MediaRow> = {}): MediaRow =>
  media(id, sortOrder, {
    kind: "VIDEO",
    cloudinaryId: null,
    alt: null,
    videoProvider: "YOUTUBE",
    videoId: "aqz-KE-bpKQ",
    ...overrides,
  });

describe("toHeroAndGallery", () => {
  it("makes the first image the hero and keeps the rest in sortOrder", () => {
    const { hero, gallery } = toHeroAndGallery("a", [
      media("img2", 2),
      video("vid", 0),
      media("img1", 1, { caption: "  A caption  " }),
      media("img3", 3),
    ]);
    expect(hero).toEqual({
      kind: "image",
      id: "img1",
      publicId: "rhm/portfolio_item/a/img1",
      alt: "Alt img1",
      caption: "A caption",
    });
    expect(gallery.map((item) => item.id)).toEqual(["vid", "img2", "img3"]);
  });

  it("builds videos from the stored provider and ID through the Phase 8 parser", () => {
    const { gallery } = toHeroAndGallery("a", [
      video("yt", 0, { title: "Showreel" }),
      video("vm", 1, { videoProvider: "VIMEO", videoId: "1084537", title: "  " }),
    ]);
    expect(gallery).toEqual([
      {
        kind: "video",
        id: "yt",
        video: {
          provider: "YOUTUBE",
          id: "aqz-KE-bpKQ",
          canonicalUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
        },
        title: "Showreel",
        caption: null,
      },
      {
        kind: "video",
        id: "vm",
        video: { provider: "VIMEO", id: "1084537", canonicalUrl: "https://vimeo.com/1084537" },
        title: null,
        caption: null,
      },
    ]);
  });

  it("has no hero when the item has no valid image", () => {
    const { hero, gallery } = toHeroAndGallery("a", [video("vid", 0)]);
    expect(hero).toBeNull();
    expect(gallery).toHaveLength(1);
  });

  it.each([
    ["an image with a full URL", media("x", 0, { cloudinaryId: "https://res.cloudinary.com/x" })],
    ["an image outside rhm/", media("x", 0, { cloudinaryId: "samples/cat" })],
    ["an image with no alt text", media("x", 0, { alt: " " })],
    ["a video with no provider", video("x", 0, { videoProvider: null })],
    ["a video with no ID", video("x", 0, { videoId: null })],
    ["a YouTube ID of the wrong shape", video("x", 0, { videoId: "short" })],
    ["a YouTube ID that smuggles a path", video("x", 0, { videoId: "aqz-KE-bpKQ/../x" })],
    ["a Vimeo ID that is not numeric", video("x", 0, { videoProvider: "VIMEO", videoId: "abc" })],
  ])("skips %s, with a warning", (_, row) => {
    const warn = vi.fn();
    expect(toHeroAndGallery("a", [row], warn)).toEqual({ hero: null, gallery: [] });
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe("detailParams", () => {
  it("lists every published slug", () => {
    expect(detailParams({ ok: true, cards: [{ slug: "a" }, { slug: "b-c" }] })).toEqual([
      { slug: "a" },
      { slug: "b-c" },
    ]);
  });

  it.each([
    ["no published item", { ok: true as const, cards: [] }],
    ["a failed read", { ok: false as const }],
  ])("gives one placeholder for %s, which no real slug can match", (_, result) => {
    expect(detailParams(result)).toEqual([{ slug: NO_SLUG }]);
    expect(SLUG.test(NO_SLUG)).toBe(false);
  });
});
