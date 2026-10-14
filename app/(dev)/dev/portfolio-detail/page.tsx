import type { Metadata } from "next";
import {
  PortfolioDetail,
  PortfolioDetailUnavailable,
} from "@/components/portfolio/portfolio-detail";
import { parseVideoUrl, type ParsedVideo } from "@/lib/media/video-url";
import type { PortfolioDetail as Detail } from "@/lib/portfolio/read-core";

// Fixture page for what the seeded items cannot show yet (Phase 12 spec, D12): a gallery of
// images and videos, lightbox navigation, a client and a linked credit; then the unavailable
// state. Fixed developer text, not block() keys: this page is not public content.

export const metadata: Metadata = { title: "Portfolio detail | Dev" };

const SAMPLE_IMAGE = "rhm/page/dev-media/sample";

function video(url: string): ParsedVideo {
  const result = parseVideoUrl(url);
  if (!result.ok) throw new Error(`${url}: ${result.error}`);
  return result.video;
}

const fixture: Detail = {
  id: "dev_fixture",
  slug: "dev-fixture",
  title: "Fixture project",
  category: "VIDEOGRAPHY",
  summary: "A fixture with every kind of media the detail page can show.",
  description:
    "This item exists only on the developer fixture page. It has a hero, two gallery images, a YouTube video and a Vimeo video, so the gallery and the lightbox can be tested without a database.",
  techStack: ["Fixture", "Playwright"],
  liveUrl: "https://example.com/",
  repoUrl: "https://github.com/example/fixture",
  featured: false,
  client: "Fixture client",
  credit: "Production: Fixture Studio",
  creditUrl: "https://example.org/",
  highlights: ["First fixture highlight.", "Second fixture highlight.", "Third fixture highlight."],
  publishedAt: "2026-10-14",
  hero: {
    kind: "image",
    id: "hero",
    publicId: SAMPLE_IMAGE,
    alt: "Fixture hero image",
    caption: null,
  },
  gallery: [
    {
      kind: "image",
      id: "gallery-1",
      publicId: SAMPLE_IMAGE,
      alt: "Fixture gallery image one",
      caption: "The first gallery caption",
    },
    {
      kind: "video",
      id: "youtube",
      video: video("https://www.youtube.com/watch?v=aqz-KE-bpKQ"),
      title: "Fixture YouTube video",
      caption: null,
    },
    {
      kind: "image",
      id: "gallery-2",
      publicId: SAMPLE_IMAGE,
      alt: "Fixture gallery image two",
      caption: null,
    },
    {
      kind: "video",
      id: "vimeo",
      video: video("https://vimeo.com/1084537"),
      title: null,
      caption: "A Vimeo video with no title of its own",
    },
  ],
};

export default function DevPortfolioDetailPage() {
  return (
    <div className="space-y-12">
      <PortfolioDetail item={fixture} />
      <section aria-labelledby="unavailable-state" className="space-y-4 border-t border-line pt-12">
        <h2 id="unavailable-state" className="text-xl font-bold">
          Unavailable
        </h2>
        <PortfolioDetailUnavailable />
      </section>
    </div>
  );
}
