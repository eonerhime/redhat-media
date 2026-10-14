import { describe, expect, it } from "vitest";
import { ASPECTS, blurImageUrl, heightFor, isRhmPublicId, type Aspect } from "./cloudinary";

describe("isRhmPublicId (Phase 8 spec, D6)", () => {
  it.each([
    "rhm/page/dev-media/sample",
    "rhm/portfolio_item/clx123/cover",
    "rhm/service/VIDEO_PRODUCTION/hero-1",
    "rhm/page/home",
  ])("accepts %s", (id) => {
    expect(isRhmPublicId(id)).toBe(true);
  });

  it.each([
    ["a full Cloudinary URL", "https://res.cloudinary.com/x/image/upload/rhm/page/a"],
    ["a third-party URL", "https://evil.example/a.jpg"],
    ["a protocol-relative URL", "//evil.example/a.jpg"],
    ["another root folder", "samples/landscapes/beach-boat"],
    ["an unknown owner type", "rhm/user/a"],
    ["the folder alone", "rhm/page"],
    ["a trailing slash", "rhm/page/a/"],
    ["an empty segment", "rhm/page//a"],
    ["path traversal", "rhm/page/../secret"],
    ["a file extension", "rhm/page/a.jpg"],
    ["a transformation", "rhm/page/c_scale,w_10/a"],
    ["a query string", "rhm/page/a?x=1"],
    ["upper-case root", "RHM/page/a"],
    ["leading whitespace", " rhm/page/a"],
    ["a newline", "rhm/page/a\n"],
    ["empty", ""],
  ])("rejects %s", (_, id) => {
    expect(isRhmPublicId(id)).toBe(false);
  });
});

describe("heightFor", () => {
  it.each([
    ["16/9", 900],
    ["16/10", 1000],
    ["4/3", 1200],
    ["3/2", 1067],
    ["1/1", 1600],
    ["3/4", 2133],
    ["4/5", 2000],
  ] as [Aspect, number][])("%s at 1600 px is %i px tall", (aspect, height) => {
    expect(heightFor(aspect)).toBe(height);
  });

  it("covers every aspect", () => {
    expect(Object.keys(ASPECTS)).toHaveLength(7);
  });
});

describe("blurImageUrl", () => {
  it("asks our own cloud for a 10 px JPEG of the same crop", () => {
    expect(blurImageUrl("lezxe6hz", "rhm/page/dev-media/sample", "16/9")).toBe(
      "https://res.cloudinary.com/lezxe6hz/image/upload/ar_16:9,c_fill,g_auto,w_10/q_auto:low,f_jpg/rhm/page/dev-media/sample",
    );
  });

  it("refuses anything that is not an rhm/ public ID", () => {
    expect(() => blurImageUrl("c", "https://evil.example/a.jpg", "1/1")).toThrow(/rhm\//);
  });
});
