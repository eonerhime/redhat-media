import { describe, expect, expectTypeOf, it } from "vitest";
import { VideoProvider } from "@/lib/generated/prisma/enums";
import {
  parseVideoUrl,
  VIDEO_ERRORS,
  VIDEO_URL_MAX_LENGTH,
  videoEmbedUrl,
  youtubeThumbnailUrl,
  type ParsedVideo,
} from "./video-url";

const YT = "aqz-KE-bpKQ";
const VM = "1084537";
const ytCanonical = `https://www.youtube.com/watch?v=${YT}`;
const vmCanonical = `https://vimeo.com/${VM}`;

describe("parseVideoUrl: accepted shapes (Phase 8 spec, D7)", () => {
  it.each([
    // YouTube watch, on every accepted host, with and without a scheme
    `https://www.youtube.com/watch?v=${YT}`,
    `https://youtube.com/watch?v=${YT}`,
    `https://m.youtube.com/watch?v=${YT}`,
    `www.youtube.com/watch?v=${YT}`,
    `youtube.com/watch?v=${YT}`,
    `HTTPS://WWW.YOUTUBE.COM/watch?v=${YT}`,
    `https://www.youtube.com/watch/?v=${YT}`,
    `https://www.youtube.com/watch?v=${YT}&t=42s&feature=share`,
    `https://www.youtube.com/watch?feature=share&v=${YT}`,
    `https://www.youtube.com/watch?v=${YT}&list=PL123`,
    // shorts and embed
    `https://www.youtube.com/shorts/${YT}`,
    `https://youtube.com/shorts/${YT}/?si=abc`,
    `https://m.youtube.com/shorts/${YT}`,
    `https://www.youtube.com/embed/${YT}`,
    `https://www.youtube.com/embed/${YT}?start=10`,
    `https://www.youtube-nocookie.com/embed/${YT}`,
    // youtu.be
    `https://youtu.be/${YT}`,
    `youtu.be/${YT}`,
    `https://youtu.be/${YT}/`,
    `https://youtu.be/${YT}?si=xyz&t=3`,
    `  https://youtu.be/${YT}  `,
  ])("YouTube: %s", (input) => {
    expect(parseVideoUrl(input)).toEqual({
      ok: true,
      video: { provider: "YOUTUBE", id: YT, canonicalUrl: ytCanonical },
    });
  });

  it.each([
    `https://vimeo.com/${VM}`,
    `https://www.vimeo.com/${VM}`,
    `vimeo.com/${VM}`,
    `https://Vimeo.com/${VM}/`,
    `https://vimeo.com/${VM}?share=copy`,
    `https://player.vimeo.com/video/${VM}`,
    `player.vimeo.com/video/${VM}?h=abc&dnt=1`,
    `https://player.vimeo.com/video/${VM}/`,
  ])("Vimeo: %s", (input) => {
    expect(parseVideoUrl(input)).toEqual({
      ok: true,
      video: { provider: "VIMEO", id: VM, canonicalUrl: vmCanonical },
    });
  });

  it("keeps the case of a YouTube ID", () => {
    const result = parseVideoUrl("https://youtu.be/AbC-_12xYz9");
    expect(result.ok && result.video.id).toBe("AbC-_12xYz9");
  });

  it("accepts a 12-digit Vimeo ID", () => {
    expect(parseVideoUrl("https://vimeo.com/123456789012").ok).toBe(true);
  });
});

describe("parseVideoUrl: rejected shapes", () => {
  it.each([
    ["an empty string", "", VIDEO_ERRORS.empty],
    ["whitespace", "   ", VIDEO_ERRORS.empty],
    [
      "an over-long input",
      `https://youtu.be/${YT}?x=${"a".repeat(VIDEO_URL_MAX_LENGTH)}`,
      VIDEO_ERRORS.tooLong,
    ],
    ["an unparseable URL", "https://exa mple.com/", VIDEO_ERRORS.invalid],
    ["http:", `http://www.youtube.com/watch?v=${YT}`, VIDEO_ERRORS.scheme],
    ["javascript:", "javascript:alert(1)", VIDEO_ERRORS.scheme],
    ["data:", "data:text/html,hi", VIDEO_ERRORS.scheme],
    ["credentials", `https://user:pw@youtu.be/${YT}`, VIDEO_ERRORS.credentials],
    ["a username only", `https://user@vimeo.com/${VM}`, VIDEO_ERRORS.credentials],
    ["a port", `https://youtu.be:8443/${YT}`, VIDEO_ERRORS.port],
    ["another host", "https://example.com/watch?v=aqz-KE-bpKQ", VIDEO_ERRORS.host],
    ["a look-alike suffix", `https://youtube.com.evil.example/watch?v=${YT}`, VIDEO_ERRORS.host],
    ["a look-alike prefix", `https://evilyoutube.com/watch?v=${YT}`, VIDEO_ERRORS.host],
    ["a subdomain of youtu.be", `https://x.youtu.be/${YT}`, VIDEO_ERRORS.host],
    ["music.youtube.com", `https://music.youtube.com/watch?v=${YT}`, VIDEO_ERRORS.host],
    ["youtube-nocookie without www", `https://youtube-nocookie.com/embed/${YT}`, VIDEO_ERRORS.host],
    ["a Vimeo look-alike", `https://vimeo.com.evil.example/${VM}`, VIDEO_ERRORS.host],
    [
      "a YouTube playlist page",
      "https://www.youtube.com/playlist?list=PL123",
      VIDEO_ERRORS.playlist,
    ],
    [
      "a watch link with only a list",
      "https://www.youtube.com/watch?list=PL123",
      VIDEO_ERRORS.playlist,
    ],
    [
      "an embedded playlist",
      "https://www.youtube.com/embed/videoseries?list=PL1",
      VIDEO_ERRORS.playlist,
    ],
    ["a channel", "https://www.youtube.com/channel/UC1234567890", VIDEO_ERRORS.channel],
    ["a handle", "https://www.youtube.com/@BlenderOfficial", VIDEO_ERRORS.channel],
    ["a /c/ link", "https://www.youtube.com/c/Blender", VIDEO_ERRORS.channel],
    ["a /user/ link", "https://www.youtube.com/user/Blender", VIDEO_ERRORS.channel],
    ["a live link", `https://www.youtube.com/live/${YT}`, VIDEO_ERRORS.live],
    ["a short YouTube ID", "https://youtu.be/abc", VIDEO_ERRORS.youtubeId],
    ["a long YouTube ID", `https://youtu.be/${YT}x`, VIDEO_ERRORS.youtubeId],
    [
      "a YouTube ID with bad characters",
      "https://www.youtube.com/watch?v=aqz-KE-bp%3C",
      VIDEO_ERRORS.youtubeId,
    ],
    ["a watch link with no v", "https://www.youtube.com/watch", VIDEO_ERRORS.youtubeId],
    ["shorts with no ID", "https://www.youtube.com/shorts/", VIDEO_ERRORS.youtubeId],
    ["the YouTube home page", "https://www.youtube.com/", VIDEO_ERRORS.unsupported],
    [
      "a YouTube path with extra segments",
      `https://www.youtube.com/embed/${YT}/x`,
      VIDEO_ERRORS.unsupported,
    ],
    ["youtu.be with extra segments", `https://youtu.be/${YT}/x`, VIDEO_ERRORS.unsupported],
    [
      "a nocookie non-embed path",
      `https://www.youtube-nocookie.com/watch?v=${YT}`,
      VIDEO_ERRORS.unsupported,
    ],
    ["a Vimeo unlisted hash", `https://vimeo.com/${VM}/abcdef1234`, VIDEO_ERRORS.vimeoUnlisted],
    ["a Vimeo showcase", "https://vimeo.com/showcase/123", VIDEO_ERRORS.vimeoCollection],
    ["a Vimeo album", "https://vimeo.com/album/123", VIDEO_ERRORS.vimeoCollection],
    ["a Vimeo channel", "https://vimeo.com/channels/staffpicks/123", VIDEO_ERRORS.vimeoCollection],
    ["a Vimeo group", "https://vimeo.com/groups/x/videos/123", VIDEO_ERRORS.vimeoCollection],
    ["the Vimeo home page", "https://vimeo.com/", VIDEO_ERRORS.vimeoId],
    ["a Vimeo user page", "https://vimeo.com/blender", VIDEO_ERRORS.unsupported],
    ["a 13-digit Vimeo ID", "https://vimeo.com/1234567890123", VIDEO_ERRORS.unsupported],
    ["a player link with no ID", "https://player.vimeo.com/video/", VIDEO_ERRORS.vimeoId],
    ["a player link with a bad ID", "https://player.vimeo.com/video/12a", VIDEO_ERRORS.vimeoId],
    ["a player non-video path", `https://player.vimeo.com/${VM}`, VIDEO_ERRORS.unsupported],
  ])("%s", (_, input, error) => {
    expect(parseVideoUrl(input)).toEqual({ ok: false, error });
  });
});

describe("videoEmbedUrl and youtubeThumbnailUrl", () => {
  it("builds the no-cookie YouTube embed", () => {
    expect(videoEmbedUrl({ provider: "YOUTUBE", id: YT })).toBe(
      `https://www.youtube-nocookie.com/embed/${YT}?autoplay=1&rel=0`,
    );
  });

  it("builds the Vimeo embed with dnt=1", () => {
    expect(videoEmbedUrl({ provider: "VIMEO", id: VM })).toBe(
      `https://player.vimeo.com/video/${VM}?autoplay=1&dnt=1`,
    );
  });

  it("builds the hqdefault thumbnail on i.ytimg.com", () => {
    expect(youtubeThumbnailUrl(YT)).toBe(`https://i.ytimg.com/vi/${YT}/hqdefault.jpg`);
  });
});

describe("providers match Prisma's VideoProvider", () => {
  it("has the same values at runtime", () => {
    expect(Object.values(VideoProvider).sort()).toEqual(["VIMEO", "YOUTUBE"]);
  });

  it("has the same type", () => {
    expectTypeOf<ParsedVideo["provider"]>().toEqualTypeOf<VideoProvider>();
  });
});
