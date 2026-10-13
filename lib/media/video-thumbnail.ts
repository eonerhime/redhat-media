import "server-only";

import { cacheLife } from "next/cache";
import { fetchVimeoThumbnail } from "./video-thumbnail-core";

/**
 * The video's `https://i.vimeocdn.com` thumbnail, or null (logged) if there is
 * none. A failure is cached for minutes so the next regeneration tries again;
 * throwing here instead would fail the prerender.
 */
export async function getVimeoThumbnail(id: string): Promise<string | null> {
  "use cache";
  const result = await fetchVimeoThumbnail(fetch, id);
  if (!result.ok) {
    cacheLife("minutes");
    console.warn(`[VideoEmbed] no Vimeo thumbnail for ${id}: ${result.error}`);
    return null;
  }
  cacheLife("weeks");
  return result.url;
}
