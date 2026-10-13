import "server-only";

import { cacheLife } from "next/cache";
import { fetchBlurDataUrl } from "./blur-core";
import type { Aspect } from "./cloudinary";

/**
 * The blur placeholder for an image, or undefined (logged) if it cannot be
 * fetched. A success is cached forever: Phase 28 replaces an image by uploading
 * a new public ID, so a public ID's pixels never change. A failure is cached
 * for minutes, so the page regenerates and tries again. Throwing here instead
 * would fail the prerender.
 */
export async function getBlurDataUrl(
  cloudName: string,
  publicId: string,
  aspect: Aspect,
): Promise<string | undefined> {
  "use cache";
  const result = await fetchBlurDataUrl(fetch, cloudName, publicId, aspect);
  if (!result.ok) {
    cacheLife("minutes");
    console.warn(`[MediaImage] no blur placeholder for ${publicId}: ${result.error}`);
    return undefined;
  }
  cacheLife("max");
  return result.dataUrl;
}
