import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cmsCopy } from "@/components/cms/cms-copy";
import { env } from "@/lib/env";

// The hidden staff entry (tech-stack.md → Architectural rules 6; Phase 24 spec,
// D11, D13). Outside the (public) group: no site header or footer, nothing links
// here, and every response is noindex (here and as X-Robots-Tag in
// lib/security/headers.ts). While CMS_ENABLED is off, every /cms page is a 404.

export const metadata: Metadata = {
  title: { default: cmsCopy.areaName, template: `%s | ${cmsCopy.areaName}` },
  robots: { index: false, follow: false },
};

export default function CmsLayout({ children }: LayoutProps<"/cms">) {
  if (!env.cms) notFound();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-line">
        <p className="container-page py-5 font-display text-lg font-extrabold">
          {cmsCopy.areaName}
        </p>
      </header>
      <main id="main" className="container-page flex-1 py-12 md:py-16">
        <div className="mx-auto max-w-md">{children}</div>
      </main>
    </div>
  );
}
