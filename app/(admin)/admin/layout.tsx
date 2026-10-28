import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cmsCopy } from "@/components/cms/cms-copy";
import { textLinkClassName } from "@/components/cms/form-styles";
import { env } from "@/lib/env";

// The staff entry (tech-stack.md → Architectural rules 6; Phase 24 spec, D11,
// D13 as amended 2026-10-26). Outside the (public) group: no site header or
// footer, no link for visitors, and every response is noindex (here and as
// X-Robots-Tag in lib/security/headers.ts). While CMS_ENABLED is off, every
// /admin page is a 404.

export const metadata: Metadata = {
  title: { default: cmsCopy.areaName, template: `%s | ${cmsCopy.areaName}` },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!env.cms) notFound();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-line">
        <div className="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5">
          <p className="font-display text-lg font-extrabold">{cmsCopy.areaName}</p>
          {/* A way back to the site from every staff page, the sign-in after sign-out
              included (owner, 2026-10-27, Phase 26 preview check). */}
          <Link href="/" className={textLinkClassName}>
            {cmsCopy.backToSite}
          </Link>
        </div>
      </header>
      <main id="main" className="container-page flex-1 py-12 md:py-16">
        <div className="mx-auto max-w-md">{children}</div>
      </main>
    </div>
  );
}
