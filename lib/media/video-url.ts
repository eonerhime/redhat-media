// The one parser that decides which video links are accepted (Phase 8 spec, D7;
// tech-stack.md → In-place CMS 6). Phase 30's attachVideo reuses it unchanged.
// Every URL this module returns is built from fixed parts plus a checked ID.

import type { VideoProvider } from "@/lib/generated/prisma/enums";

export type ParsedVideo = {
  provider: VideoProvider;
  id: string;
  canonicalUrl: string;
};

export type ParseVideoResult = { ok: true; video: ParsedVideo } | { ok: false; error: string };

export const VIDEO_URL_MAX_LENGTH = 2048;

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^[0-9]{1,12}$/;

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);
const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com"]);

export const VIDEO_ERRORS = {
  empty: "Enter a YouTube or Vimeo link.",
  tooLong: `Links can be at most ${VIDEO_URL_MAX_LENGTH} characters.`,
  invalid: "That is not a valid link.",
  scheme: "Links must use https://.",
  credentials: "Links must not contain a username or password.",
  port: "Links must not include a port.",
  host: "Only YouTube and Vimeo links are accepted.",
  playlist: "Playlists are not supported. Link to a single video.",
  channel: "Channel links are not supported. Link to a single video.",
  live: "Live-stream links are not supported. Link to the video itself.",
  vimeoUnlisted: "Unlisted Vimeo links (with a hash) are not supported. Make the video public.",
  vimeoCollection:
    "Vimeo showcases, channels and groups are not supported. Link to a single video.",
  youtubeId: "That YouTube link has no valid video ID.",
  vimeoId: "That Vimeo link has no valid video ID.",
  unsupported: "That link is not a supported YouTube or Vimeo video address.",
} as const;

const fail = (error: string): ParseVideoResult => ({ ok: false, error });

function youtube(id: string | null | undefined): ParseVideoResult {
  if (!id || !YOUTUBE_ID.test(id)) return fail(VIDEO_ERRORS.youtubeId);
  return {
    ok: true,
    video: { provider: "YOUTUBE", id, canonicalUrl: `https://www.youtube.com/watch?v=${id}` },
  };
}

function vimeo(id: string | undefined): ParseVideoResult {
  if (!id || !VIMEO_ID.test(id)) return fail(VIDEO_ERRORS.vimeoId);
  return { ok: true, video: { provider: "VIMEO", id, canonicalUrl: `https://vimeo.com/${id}` } };
}

/** Path segments without empty parts, so a trailing slash is ignored. */
const segmentsOf = (url: URL) => url.pathname.split("/").filter(Boolean);

function parseYoutube(url: URL): ParseVideoResult {
  const [first, second, ...rest] = segmentsOf(url);
  if (first === "playlist") return fail(VIDEO_ERRORS.playlist);
  if (first === "live") return fail(VIDEO_ERRORS.live);
  if (first === "channel" || first === "c" || first === "user" || first?.startsWith("@"))
    return fail(VIDEO_ERRORS.channel);
  if (first === "watch" && second === undefined) {
    const id = url.searchParams.get("v");
    if (!id && url.searchParams.has("list")) return fail(VIDEO_ERRORS.playlist);
    return youtube(id);
  }
  if ((first === "shorts" || first === "embed") && rest.length === 0) {
    if (first === "embed" && second === "videoseries") return fail(VIDEO_ERRORS.playlist);
    return youtube(second);
  }
  return fail(VIDEO_ERRORS.unsupported);
}

function parseVimeo(url: URL): ParseVideoResult {
  const [first, second] = segmentsOf(url);
  if (first === "showcase" || first === "album" || first === "channels" || first === "groups")
    return fail(VIDEO_ERRORS.vimeoCollection);
  if (first === undefined) return fail(VIDEO_ERRORS.vimeoId);
  if (VIMEO_ID.test(first)) {
    // vimeo.com/{id}/{hash}: the hash would be needed in the embed URL (D7).
    if (second !== undefined) return fail(VIDEO_ERRORS.vimeoUnlisted);
    return vimeo(first);
  }
  return fail(VIDEO_ERRORS.unsupported);
}

/**
 * Accepts the YouTube and Vimeo link shapes listed in Phase 8 spec D7 and
 * returns the provider, the video ID and the canonical URL. Extra query
 * parameters (`si`, `t`, `share`, `feature`, …) are dropped.
 *
 * @example parseVideoUrl("youtu.be/aqz-KE-bpKQ?si=x")
 *   // { ok: true, video: { provider: "YOUTUBE", id: "aqz-KE-bpKQ", canonicalUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ" } }
 */
export function parseVideoUrl(input: string): ParseVideoResult {
  const trimmed = input.trim();
  if (trimmed === "") return fail(VIDEO_ERRORS.empty);
  if (trimmed.length > VIDEO_URL_MAX_LENGTH) return fail(VIDEO_ERRORS.tooLong);

  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return fail(VIDEO_ERRORS.invalid);
  }
  if (url.protocol !== "https:") return fail(VIDEO_ERRORS.scheme);
  if (url.username !== "" || url.password !== "") return fail(VIDEO_ERRORS.credentials);
  if (url.port !== "") return fail(VIDEO_ERRORS.port);

  // URL lower-cases the host, so the match below is case-insensitive and exact.
  const host = url.hostname;
  if (YOUTUBE_HOSTS.has(host)) return parseYoutube(url);
  if (host === "youtu.be") {
    const [id, ...rest] = segmentsOf(url);
    return rest.length === 0 ? youtube(id) : fail(VIDEO_ERRORS.unsupported);
  }
  if (host === "www.youtube-nocookie.com") {
    const [first, id, ...rest] = segmentsOf(url);
    return first === "embed" && rest.length === 0 ? youtube(id) : fail(VIDEO_ERRORS.unsupported);
  }
  if (VIMEO_HOSTS.has(host)) return parseVimeo(url);
  if (host === "player.vimeo.com") {
    const [first, id, ...rest] = segmentsOf(url);
    if (first !== "video" || rest.length > 0) return fail(VIDEO_ERRORS.unsupported);
    return vimeo(id);
  }
  return fail(VIDEO_ERRORS.host);
}

/** The player URL the facade loads on click: no-cookie YouTube, Vimeo with dnt=1. */
export function videoEmbedUrl(video: Pick<ParsedVideo, "provider" | "id">): string {
  return video.provider === "YOUTUBE"
    ? `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`
    : `https://player.vimeo.com/video/${video.id}?autoplay=1&dnt=1`;
}

/** `hqdefault` exists for every YouTube video; `maxresdefault` can 404. */
export function youtubeThumbnailUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
