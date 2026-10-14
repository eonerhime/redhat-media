// JSON-LD without dangerouslySetInnerHTML (tech-stack.md → Security baseline; Phase 5 spec, D5).
// <JsonLd> renders serializeJsonLd() as the text child of <script type="application/ld+json">.

export type JsonLd = { "@context": "https://schema.org"; "@type": string } & Record<
  string,
  unknown
>;

// JSON.stringify with every `<` written as \u003c, so the output holds no `<` and nothing in the
// data can close the script tag or open a comment. It still parses back to the same value.
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export type ServiceJsonLdInput = {
  name: string;
  description: string;
  slug: string;
  siteName: string;
  /** Canonical origin without a trailing slash (lib/env.ts). */
  siteUrl: string;
};

// `Service` per service page (Architectural rules 9). Phase 14 adds the site-wide Organization.
export function serviceJsonLd({
  name,
  description,
  slug,
  siteName,
  siteUrl,
}: ServiceJsonLdInput): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    serviceType: name,
    url: `${siteUrl}/services/${slug}`,
    provider: { "@type": "Organization", name: siteName, url: siteUrl },
  };
}

export type VideoJsonLdInput = {
  name: string;
  description: string;
  thumbnailUrl: string | null;
  embedUrl: string;
  /** The canonical YouTube or Vimeo URL. */
  contentUrl: string;
  /** ISO 8601; MediaItem does not store it yet, so it is left out until known (Phase 30). */
  uploadDate?: string | null;
};

export type PortfolioJsonLdInput = {
  name: string;
  description: string;
  slug: string;
  /** The service name for the item's category. */
  genre: string;
  keywords: readonly string[];
  credit: string | null;
  /** YYYY-MM-DD */
  datePublished: string | null;
  /** An absolute cover image URL (lib/media/cloudinary.ts → deliveryUrl). */
  image: string | null;
  liveUrl: string | null;
  videos: readonly VideoJsonLdInput[];
  siteName: string;
  /** Canonical origin without a trailing slash (lib/env.ts). */
  siteUrl: string;
};

// `CreativeWork` for every portfolio item, plus a `VideoObject` per video (Architectural rules 9;
// Phase 12 spec, D10). Not `SoftwareApplication`: Google's Software App result requires a price
// and a rating or review, which RHM's case studies do not have and must not invent. Empty fields
// are left out rather than sent as null.
export function portfolioItemJsonLd(input: PortfolioJsonLdInput): JsonLd {
  const videos = input.videos.map((video) =>
    compact({
      "@type": "VideoObject",
      name: video.name,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      embedUrl: video.embedUrl,
      contentUrl: video.contentUrl,
      uploadDate: video.uploadDate,
    }),
  );
  return compact({
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: input.name,
    description: input.description,
    url: `${input.siteUrl}/portfolio/${input.slug}`,
    image: input.image,
    datePublished: input.datePublished,
    genre: input.genre,
    keywords: input.keywords.length > 0 ? input.keywords.join(", ") : null,
    creditText: input.credit,
    creator: { "@type": "Organization", name: input.siteName, url: input.siteUrl },
    sameAs: input.liveUrl,
    video: videos.length > 0 ? videos : null,
  }) as JsonLd;
}

function compact(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== null && value !== undefined),
  );
}
