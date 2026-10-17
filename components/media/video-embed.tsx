import { getVimeoThumbnail } from "@/lib/media/video-thumbnail";
import { videoEmbedUrl, youtubeThumbnailUrl, type ParsedVideo } from "@/lib/media/video-url";
import { MediaImage } from "./media-image";
import { VideoFacade } from "./video-facade";

type VideoEmbedProps = {
  /** From parseVideoUrl() (lib/media/video-url.ts), or the stored MediaItem fields. */
  video: ParsedVideo;
  /** The player's accessible name: "Play video: {title}". */
  title: string;
  /** A custom poster; otherwise the provider's thumbnail, then a branded placeholder. */
  posterPublicId?: string;
  /** For the poster image, e.g. "(min-width: 1024px) 50vw, 100vw". */
  sizes?: string;
};

/**
 * A YouTube or Vimeo video shown as a thumbnail that loads the player only on
 * click (Phase 8 spec, D8, D9).
 *
 * @example <VideoEmbed video={parsed.video} title="Showreel 2026" />
 */
export async function VideoEmbed({
  video,
  title,
  posterPublicId,
  sizes = "100vw",
}: VideoEmbedProps) {
  const poster = posterPublicId ? (
    <MediaImage publicId={posterPublicId} alt="" aspect="16/9" sizes={sizes} />
  ) : undefined;
  const posterUrl = posterPublicId
    ? null
    : video.provider === "YOUTUBE"
      ? youtubeThumbnailUrl(video.id)
      : await getVimeoThumbnail(video.id);

  return (
    <VideoFacade
      title={title}
      canonicalUrl={video.canonicalUrl}
      embedUrl={videoEmbedUrl(video)}
      poster={poster}
      posterUrl={posterUrl}
    />
  );
}
