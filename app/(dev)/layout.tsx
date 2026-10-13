import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isDevPagesEnabled } from "@/lib/dev-pages";
import { env } from "@/lib/env";

// Developer fixture pages: never indexed, and 404 on the production deployment
// (Phase 8 spec, D11).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (!isDevPagesEnabled(env)) notFound();
  return (
    <main id="main" className="container-page flex-1 py-12">
      {children}
    </main>
  );
}
