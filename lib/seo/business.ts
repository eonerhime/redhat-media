// The business facts for structured data, read from lib/site.ts so the footer, /contact and the
// JSON-LD cannot disagree (Phase 14 spec, D6).

import { env } from "@/lib/env";
import type { BusinessJsonLdInput } from "@/lib/seo/json-ld";
import { business, contact, siteName } from "@/lib/site";

export function businessJsonLdInput(): BusinessJsonLdInput {
  return {
    siteName,
    siteUrl: env.siteUrl,
    logoPath: business.logoOnLight,
    email: contact.email,
    telephone: contact.phoneInternational,
    registration: contact.registration,
    address: business.address,
    areaServed: business.areaServed,
    openingHours: business.openingHours,
  };
}
