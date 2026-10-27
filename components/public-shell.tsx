import { EditModeProvider } from "@/components/cms/edit-mode";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { env } from "@/lib/env";

// The public page frame: skip link, header, main and footer. Shared by the public layout and the
// root not-found, which renders outside that layout (Phase 15 spec, D1). Where the CMS is on, the
// edit-mode provider wraps it all, so the header's admin icon and the Editing pill share one
// session read; production pages carry none of it until Phase 34 (Phase 26 spec, D1, D2).
export function PublicShell({ children }: { children: React.ReactNode }) {
  const frame = (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded bg-fg px-4 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
  return env.cms ? <EditModeProvider>{frame}</EditModeProvider> : frame;
}
