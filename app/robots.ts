import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { robotsRules } from "@/lib/seo/sitemap";

// The same file on previews: they sit behind deployment protection and Vercel sends noindex on
// them, and a Disallow would block the validators (Phase 14 spec, D5).
export default function robots(): MetadataRoute.Robots {
  return robotsRules(env.siteUrl);
}
