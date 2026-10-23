import type { Metadata } from "next";
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
import { itemMetadata, itemStaticParams, readItem } from "@/lib/portfolio/item-route";
import type { PortfolioDetail as Detail } from "@/lib/portfolio/read-core";
import { portfolioItemJsonLd } from "@/lib/seo/json-ld";
import { siteName } from "@/lib/site";

// Static params, the slug check, the read and the metadata are shared with the modal route
// (Phase 22 spec, D9; Phase 12 spec, D1, D9).
export async function generateStaticParams() {
  return itemStaticParams();
}

export async function generateMetadata({
  params,
}: PageProps<"/portfolio/[slug]">): Promise<Metadata> {
  return itemMetadata(params);
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
