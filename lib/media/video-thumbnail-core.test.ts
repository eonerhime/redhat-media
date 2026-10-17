import { describe, expect, it, vi } from "vitest";
import type { FetchFn } from "./fetch-capped";
import { fetchVimeoThumbnail, isVimeoThumbnailUrl, vimeoOembedUrl } from "./video-thumbnail-core";

const THUMB = "https://i.vimeocdn.com/video/20963649-f028_960?region=us";

const json = (body: unknown, init: ResponseInit = {}): FetchFn =>
  vi.fn(async () => new Response(JSON.stringify(body), init));

describe("vimeoOembedUrl", () => {
  it("builds the fixed oEmbed URL from a numeric ID", () => {
    expect(vimeoOembedUrl("1084537")).toBe(
      "https://vimeo.com/api/oembed.json?url=https%3A%2F%2Fvimeo.com%2F1084537&width=1280",
    );
  });

  it.each(["", "12a", "1084537/x", "https://evil.example", "1234567890123"])("refuses %j", (id) => {
    expect(() => vimeoOembedUrl(id)).toThrow(/numeric/);
  });
});

describe("fetchVimeoThumbnail (Phase 8 spec, D8)", () => {
  it("returns an i.vimeocdn.com thumbnail", async () => {
    const fetchFn = json({ type: "video", thumbnail_url: THUMB });
    expect(await fetchVimeoThumbnail(fetchFn, "1084537")).toEqual({ ok: true, url: THUMB });
    const [url, init] = vi.mocked(fetchFn).mock.calls[0];
    expect(url).toBe(vimeoOembedUrl("1084537"));
    expect(init?.redirect).toBe("error");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("drops a non-200 response", async () => {
    expect(await fetchVimeoThumbnail(json({}, { status: 404 }), "1")).toEqual({
      ok: false,
      error: "HTTP 404",
    });
  });

  it("drops invalid JSON", async () => {
    const fetchFn: FetchFn = vi.fn(async () => new Response("not json"));
    expect(await fetchVimeoThumbnail(fetchFn, "1")).toEqual({ ok: false, error: "invalid JSON" });
  });

  it("drops JSON without a thumbnail", async () => {
    expect(await fetchVimeoThumbnail(json({ type: "video" }), "1")).toEqual({
      ok: false,
      error: "unexpected oEmbed shape",
    });
  });

  it.each([
    ["another host", "https://evil.example/a.jpg"],
    ["a look-alike host", "https://i.vimeocdn.com.evil.example/a.jpg"],
    ["http:", "http://i.vimeocdn.com/video/1.jpg"],
    ["a port", "https://i.vimeocdn.com:8443/video/1.jpg"],
    ["javascript:", "javascript:alert(1)"],
    ["not a URL", "nope"],
  ])("drops a thumbnail on %s", async (_, thumbnail_url) => {
    expect(await fetchVimeoThumbnail(json({ thumbnail_url }), "1")).toEqual({
      ok: false,
      error: "thumbnail not on https://i.vimeocdn.com",
    });
  });

  it("returns an error instead of throwing on a timeout", async () => {
    const fetchFn: FetchFn = vi.fn(async () => {
      throw new DOMException("timed out", "TimeoutError");
    });
    expect(await fetchVimeoThumbnail(fetchFn, "1")).toEqual({
      ok: false,
      error: "fetch failed: TimeoutError",
    });
  });

  it("never fetches for a non-numeric ID", async () => {
    const fetchFn = json({ thumbnail_url: THUMB });
    await expect(fetchVimeoThumbnail(fetchFn, "../x")).rejects.toThrow();
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe("isVimeoThumbnailUrl", () => {
  it("accepts https://i.vimeocdn.com", () => {
    expect(isVimeoThumbnailUrl(THUMB)).toBe(true);
  });
});
