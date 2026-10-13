import type { Metadata } from "next";
import { MediaImage } from "@/components/media/media-image";
import { VideoEmbed } from "@/components/media/video-embed";
import { parseVideoUrl, type ParsedVideo } from "@/lib/media/video-url";

// Fixture page for the media primitives (Phase 8 spec, D11). Fixed developer
// copy, not block() keys: this page is not public content. Phases 9–12 can
// reuse it.

export const metadata: Metadata = { title: "Media fixtures | Dev" };

const SAMPLE_IMAGE = "rhm/page/dev-media/sample";

// Blender Foundation's Big Buck Bunny (CC BY 3.0), on each provider.
const YOUTUBE_URL = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";
const VIMEO_URL = "https://vimeo.com/1084537";

function video(url: string): ParsedVideo {
  const result = parseVideoUrl(url);
  if (!result.ok) throw new Error(`${url}: ${result.error}`);
  return result.video;
}

export default function DevMediaPage() {
  return (
    <div className="space-y-12">
      <h1 className="font-display text-3xl font-extrabold">Media fixtures</h1>

      <section aria-labelledby="hero-image" className="space-y-4">
        <h2 id="hero-image" className="text-xl font-bold">
          Preloaded image (16:9)
        </h2>
        <MediaImage
          publicId={SAMPLE_IMAGE}
          alt="Sample photo, preloaded"
          aspect="16/9"
          sizes="(min-width: 1280px) 1200px, 100vw"
          preload
        />
      </section>

      {/* Pushes the next image below the fold, so lazy loading is observable. */}
      <div aria-hidden="true" className="h-[150vh]" />

      <section aria-labelledby="lazy-image" className="space-y-4">
        <h2 id="lazy-image" className="text-xl font-bold">
          Lazy image (4:3)
        </h2>
        <MediaImage
          publicId={SAMPLE_IMAGE}
          alt="Sample photo, lazy"
          aspect="4/3"
          sizes="(min-width: 768px) 50vw, 100vw"
          className="max-w-xl"
        />
      </section>

      <section aria-labelledby="videos" className="space-y-4">
        <h2 id="videos" className="text-xl font-bold">
          Videos
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          <VideoEmbed video={video(YOUTUBE_URL)} title="Big Buck Bunny on YouTube" />
          <VideoEmbed video={video(VIMEO_URL)} title="Big Buck Bunny on Vimeo" />
        </div>
      </section>
    </div>
  );
}
