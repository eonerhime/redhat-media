import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";
import { NotFoundView } from "@/components/shared/not-found-view";
import { notFoundCopy, siteName } from "@/lib/site";

// Unmatched URLs, and /dev/* in production, render here, outside the public layout, so the view
// brings its own header and footer (Phase 15 spec, D1). Next answers 404 and adds noindex.
export const metadata: Metadata = { title: `${notFoundCopy.title} | ${siteName}` };

export default function RootNotFound() {
  return (
    <PublicShell>
      <NotFoundView />
    </PublicShell>
  );
}
