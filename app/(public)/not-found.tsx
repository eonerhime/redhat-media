import type { Metadata } from "next";
import { NotFoundView } from "@/components/shared/not-found-view";
import { notFoundCopy, siteName } from "@/lib/site";

// notFound() in a public page (an unknown or muted slug) renders here, inside the public layout.
// Next adds noindex itself (Phase 15 spec, D1).
export const metadata: Metadata = { title: `${notFoundCopy.title} | ${siteName}` };

export default function PublicNotFound() {
  return <NotFoundView />;
}
