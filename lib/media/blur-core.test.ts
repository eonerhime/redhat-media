import { describe, expect, it, vi } from "vitest";
import { BLUR_MAX_BYTES, blurStyle, fetchBlurDataUrl } from "./blur-core";
import type { FetchFn } from "./fetch-capped";

const ID = "rhm/page/dev-media/sample";
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

const respond = (body: BodyInit | null, init: ResponseInit = {}): FetchFn =>
  vi.fn(async () => new Response(body, { headers: { "content-type": "image/jpeg" }, ...init }));

describe("fetchBlurDataUrl (Phase 8 spec, D5)", () => {
  it("returns the image as a base64 data: URL", async () => {
    expect(await fetchBlurDataUrl(respond(JPEG), "lezxe6hz", ID, "16/9")).toEqual({
      ok: true,
      dataUrl: "data:image/jpeg;base64,/9j/2Q==",
    });
  });

  it("fetches only our cloud, with a timeout and no redirects", async () => {
    const fetchFn = respond(JPEG);
    await fetchBlurDataUrl(fetchFn, "lezxe6hz", ID, "4/3");
    const [url, init] = vi.mocked(fetchFn).mock.calls[0];
    expect(url).toMatch(/^https:\/\/res\.cloudinary\.com\/lezxe6hz\/image\/upload\/ar_4:3,/);
    expect(init?.redirect).toBe("error");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("rejects a body over 4 KB", async () => {
    const big = new Uint8Array(BLUR_MAX_BYTES + 1);
    expect(await fetchBlurDataUrl(respond(big), "c", ID, "1/1")).toEqual({
      ok: false,
      error: "body over 4096 bytes",
    });
  });

  it("rejects an oversized body that has no content-length", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < 5; i++) controller.enqueue(new Uint8Array(1024));
        controller.close();
      },
    });
    expect(await fetchBlurDataUrl(respond(stream), "c", ID, "1/1")).toEqual({
      ok: false,
      error: "body over 4096 bytes",
    });
  });

  it("rejects a response that is not an image", async () => {
    const fetchFn = respond("<html>", { headers: { "content-type": "text/html" } });
    expect(await fetchBlurDataUrl(fetchFn, "c", ID, "1/1")).toEqual({
      ok: false,
      error: "not an image: text/html",
    });
  });

  it("rejects a non-200 status", async () => {
    expect(await fetchBlurDataUrl(respond(null, { status: 404 }), "c", ID, "1/1")).toEqual({
      ok: false,
      error: "HTTP 404",
    });
  });

  it("returns an error instead of throwing when the fetch fails", async () => {
    const fetchFn: FetchFn = vi.fn(async () => {
      throw new DOMException("timed out", "TimeoutError");
    });
    expect(await fetchBlurDataUrl(fetchFn, "c", ID, "1/1")).toEqual({
      ok: false,
      error: "fetch failed: TimeoutError",
    });
  });

  it("never fetches for a public ID outside rhm/", async () => {
    const fetchFn = respond(JPEG);
    await expect(fetchBlurDataUrl(fetchFn, "c", "https://evil.example/a", "1/1")).rejects.toThrow();
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe("blurStyle (Phase 16 amendment to Phase 8 D5)", () => {
  it("wraps the data: URL in next/image's blur SVG, sized to the image", () => {
    const style = blurStyle("data:image/jpeg;base64,/9j/2Q==", 1600, 1000);
    expect(style.backgroundImage).toMatch(/^url\("data:image\/svg\+xml;charset=utf-8,%3Csvg /);
    expect(style.backgroundImage).toContain("viewBox='0 0 1600 1000'");
    expect(style.backgroundImage).toContain("feGaussianBlur stdDeviation='20'");
    expect(style.backgroundImage).toContain("href='data:image/jpeg;base64,/9j/2Q=='");
    expect(style).toMatchObject({ backgroundSize: "cover", backgroundRepeat: "no-repeat" });
  });
});
