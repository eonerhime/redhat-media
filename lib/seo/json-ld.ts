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
