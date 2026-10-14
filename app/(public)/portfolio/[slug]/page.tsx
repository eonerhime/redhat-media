import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  PortfolioDetail,
  PortfolioDetailUnavailable,
} from "@/components/portfolio/portfolio-detail";
import { Cta } from "@/components/shared/cta";
import { JsonLd } from "@/components/shared/json-ld";
import { block } from "@/lib/content/block";
import { serviceByCategory } from "@/lib/content/services";
import { env } from "@/lib/env";
import { deliveryUrl } from "@/lib/media/cloudinary";
import { getVimeoThumbnail } from "@/lib/media/video-thumbnail";
import { videoEmbedUrl, youtubeThumbnailUrl } from "@/lib/media/video-url";
import { getPortfolioItem, getPublishedPortfolio } from "@/lib/portfolio/read";
import { detailParams, type PortfolioDetail as Detail } from "@/lib/portfolio/read-core";
import { SLUG } from "@/lib/portfolio/schema";
import { portfolioItemJsonLd } from "@/lib/seo/json-ld";
import { siteName } from "@/lib/site";

// Every published slug is prerendered. With no database (the CI build) or no published item there
// is one placeholder that 404s, because Cache Components rejects an empty list. A slug published
// later renders on its first request and is then cached (Phase 12 spec, D1).
export async function generateStaticParams() {
  return detailParams(await getPublishedPortfolio());
}

// A slug the seed and CMS could never write is a 404 without a database read, so junk URLs cannot
// fill the cache.
async function readItem(params: PageProps<"/portfolio/[slug]">["params"]) {
  const { slug } = await params;
  if (slug.length > 60 || !SLUG.test(slug)) notFound();
  const result = await getPortfolioItem(slug);
  if (result.ok && !result.item) notFound();
  return result.ok ? result.item : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/portfolio/[slug]">): Promise<Metadata> {
  const item = await readItem(params);
  if (!item) {
    // Unavailable (D3): keep the page out of the index until the read heals.
    return { title: `Portfolio | ${siteName}`, robots: { index: false } };
  }
  return { title: `${item.title} | ${siteName}`, description: item.summary };
}

export default async function PortfolioItemPage({ params }: PageProps<"/portfolio/[slug]">) {
  const item = await readItem(params);
  // Unavailable (D3): the message, a way back and, as on /portfolio, the CTA.
  if (!item) {
    return (
      <>
        <PortfolioDetailUnavailable />
        <div className="border-t border-line">
          <Cta />
        </div>
      </>
    );
  }
  return (
    <>
      <JsonLd data={await itemJsonLd(item)} />
      <PortfolioDetail item={item} />
    </>
  );
}

async function itemJsonLd(item: Detail) {
  const cloudName = env.cloudinaryCloudName;
  const videos = await Promise.all(
    item.gallery.flatMap((media) =>
      media.kind === "video"
        ? [
            (async () => ({
              name: media.title ?? item.title,
              description: media.caption ?? item.summary,
              thumbnailUrl:
                media.video.provider === "YOUTUBE"
                  ? youtubeThumbnailUrl(media.video.id)
                  : await getVimeoThumbnail(media.video.id),
              embedUrl: videoEmbedUrl(media.video),
              contentUrl: media.video.canonicalUrl,
            }))(),
          ]
        : [],
    ),
  );
  return portfolioItemJsonLd({
    name: item.title,
    description: item.summary,
    slug: item.slug,
    genre: await block(serviceByCategory(item.category).nameKey),
    keywords: item.techStack,
    credit: item.credit,
    datePublished: item.publishedAt,
    image: item.hero && cloudName ? deliveryUrl(cloudName, item.hero.publicId) : null,
    liveUrl: item.liveUrl,
    videos,
    siteName,
    siteUrl: env.siteUrl,
  });
}
