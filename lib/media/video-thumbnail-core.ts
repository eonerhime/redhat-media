// Vimeo thumbnail lookup (Phase 8 spec, D8). The server entry point is
// ./video-thumbnail.ts; this module takes `fetch` as an argument so tests need
// no network. The only endpoint is Vimeo's fixed oEmbed URL with a numeric ID.

import { z } from "zod";
import { fetchCapped, type FetchFn } from "./fetch-capped";

const VIMEO_ID = /^[0-9]{1,12}$/;
const OEMBED_MAX_BYTES = 64 * 1024;

const oembedSchema = z.object({ thumbnail_url: z.string().max(2048) });

export function vimeoOembedUrl(id: string): string {
  if (!VIMEO_ID.test(id)) throw new Error("Vimeo IDs are numeric");
  const video = encodeURIComponent(`https://vimeo.com/${id}`);
  return `https://vimeo.com/api/oembed.json?url=${video}&width=1280`;
}

/** Only https://i.vimeocdn.com/… is kept, so the <img> stays inside the CSP's img-src. */
export function isVimeoThumbnailUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "i.vimeocdn.com" && url.port === "";
  } catch {
    return false;
  }
}

export type ThumbnailResult = { ok: true; url: string } | { ok: false; error: string };

export async function fetchVimeoThumbnail(fetchFn: FetchFn, id: string): Promise<ThumbnailResult> {
  const result = await fetchCapped(fetchFn, vimeoOembedUrl(id), OEMBED_MAX_BYTES);
  if (!result.ok) return result;

  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder().decode(result.body));
  } catch {
    return { ok: false, error: "invalid JSON" };
  }
  const parsed = oembedSchema.safeParse(json);
  if (!parsed.success) return { ok: false, error: "unexpected oEmbed shape" };
  if (!isVimeoThumbnailUrl(parsed.data.thumbnail_url))
    return { ok: false, error: "thumbnail not on https://i.vimeocdn.com" };
  return { ok: true, url: parsed.data.thumbnail_url };
}
