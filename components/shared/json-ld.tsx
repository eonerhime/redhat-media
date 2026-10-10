import { serializeJsonLd, type JsonLd as JsonLdData } from "@/lib/seo/json-ld";

// React 19 writes <script> text children raw, and serializeJsonLd() leaves no `<` in them, so
// this needs no dangerouslySetInnerHTML (Phase 5 spec, D5). A data block never runs, so the CSP
// does not apply.
export function JsonLd({ data }: { data: JsonLdData }) {
  return <script type="application/ld+json">{serializeJsonLd(data)}</script>;
}
