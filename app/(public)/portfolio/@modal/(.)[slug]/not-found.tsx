import type { Metadata } from "next";
import { MODAL_LABEL_ID } from "@/components/portfolio/modal-label";
import { NotFoundView } from "@/components/shared/not-found-view";
import { notFoundCopy, siteName } from "@/lib/site";

// An item unpublished after the grid loaded: the 404 view inside the dialog, so Close and Back
// still return to the grid (Phase 22 spec, D8 as amended 2026-10-23). Next adds noindex itself.
export const metadata: Metadata = { title: `${notFoundCopy.title} | ${siteName}` };

export default function PortfolioModalNotFound() {
  return <NotFoundView headingId={MODAL_LABEL_ID} />;
}
