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
