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

/** The Organization's node ID, so Service, CreativeWork and LocalBusiness all point at one company. */
export function organizationId(siteUrl: string): string {
  return `${siteUrl}/#organization`;
}

function organizationRef(siteName: string, siteUrl: string) {
  return { "@type": "Organization", "@id": organizationId(siteUrl), name: siteName, url: siteUrl };
}

export type BusinessJsonLdInput = {
  siteName: string;
  /** Canonical origin without a trailing slash (lib/env.ts). */
  siteUrl: string;
  /** The logo on white, as a site path (lib/site.ts → business.logoOnLight). */
  logoPath: string;
  email: string;
  /** International format, e.g. "+234 802 658 1200". */
  telephone: string;
  registration: string;
  address: { locality: string; region: string; country: string };
  areaServed: string;
  openingHours: { days: readonly string[]; opens: string; closes: string };
};

function postalAddress(address: BusinessJsonLdInput["address"]) {
  return {
    "@type": "PostalAddress",
    addressLocality: address.locality,
    addressRegion: address.region,
    addressCountry: address.country,
  };
}

// `Organization` on the homepage (Phase 14 spec, D6). Only facts the site already shows: no
// rating, review, price range or founding claim (mission principle 4).
export function organizationJsonLd(input: BusinessJsonLdInput): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId(input.siteUrl),
    name: input.siteName,
    url: input.siteUrl,
    logo: `${input.siteUrl}${input.logoPath}`,
    email: input.email,
    telephone: input.telephone,
    address: postalAddress(input.address),
    identifier: input.registration,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: input.email,
      telephone: input.telephone,
      availableLanguage: "English",
    },
  };
}

// `LocalBusiness` on /contact (D6). Google requires only name and address, and asks for "as many
// address properties as possible", so a city-only address validates (owner answer A).
export function localBusinessJsonLd(input: BusinessJsonLdInput): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${input.siteUrl}/contact#business`,
    name: input.siteName,
    url: `${input.siteUrl}/contact`,
    image: `${input.siteUrl}${input.logoPath}`,
    email: input.email,
    telephone: input.telephone,
    address: postalAddress(input.address),
    areaServed: { "@type": "Country", name: input.areaServed },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: input.openingHours.days.map((day) => `https://schema.org/${day}`),
      opens: input.openingHours.opens,
      closes: input.openingHours.closes,
    },
    parentOrganization: { "@id": organizationId(input.siteUrl) },
  };
}

// `Service` per service page (Architectural rules 9), provided by the site's Organization.
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
    provider: organizationRef(siteName, siteUrl),
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
    creator: organizationRef(input.siteName, input.siteUrl),
    sameAs: input.liveUrl,
    video: videos.length > 0 ? videos : null,
  }) as JsonLd;
}

function compact(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== null && value !== undefined),
  );
}
