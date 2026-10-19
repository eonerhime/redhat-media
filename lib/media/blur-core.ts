// Blur placeholder logic (Phase 8 spec, D5). The server entry point is
// ./blur.ts; this module takes `fetch` as an argument so tests need no network.

import { blurImageUrl, type Aspect } from "./cloudinary";
import { fetchCapped, type FetchFn } from "./fetch-capped";

export const BLUR_MAX_BYTES = 4096;

const IMAGE_TYPE = /^image\/[a-z0-9.+-]+$/;

export type BlurResult = { ok: true; dataUrl: string } | { ok: false; error: string };

/** Fetches the 10 px rendition from our own cloud and returns it as a data: URL. */
export async function fetchBlurDataUrl(
  fetchFn: FetchFn,
  cloudName: string,
  publicId: string,
  aspect: Aspect,
): Promise<BlurResult> {
  const result = await fetchCapped(
    fetchFn,
    blurImageUrl(cloudName, publicId, aspect),
    BLUR_MAX_BYTES,
  );
  if (!result.ok) return result;

  const type = result.response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (!type || !IMAGE_TYPE.test(type)) return { ok: false, error: `not an image: ${type}` };
  if (result.body.byteLength === 0) return { ok: false, error: "empty body" };

  return {
    ok: true,
    dataUrl: `data:${type};base64,${Buffer.from(result.body).toString("base64")}`,
  };
}

/**
 * The placeholder as an inline style for a server-rendered <img>: next/image's own blur SVG
 * around the tiny JPEG. Nothing removes it after load (there is no client code), so it stays
 * behind the image, which hides it unless the image has transparent pixels (Phase 16 amendment
 * to Phase 8 D5).
 */
export function blurStyle(dataUrl: string, width: number, height: number) {
  const svg =
    `%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E` +
    `%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E` +
    `%3CfeColorMatrix values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1' result='s'/%3E` +
    `%3CfeFlood x='0' y='0' width='100%25' height='100%25'/%3E%3CfeComposite operator='out' in='s'/%3E` +
    `%3CfeComposite in2='SourceGraphic'/%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E` +
    `%3Cimage width='100%25' height='100%25' x='0' y='0' preserveAspectRatio='none' ` +
    `style='filter: url(%23b);' href='${dataUrl}'/%3E%3C/svg%3E`;
  return {
    backgroundSize: "cover",
    backgroundPosition: "50% 50%",
    backgroundRepeat: "no-repeat",
    backgroundImage: `url("data:image/svg+xml;charset=utf-8,${svg}")`,
  };
}
