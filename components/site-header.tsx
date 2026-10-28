import { StaffLink } from "@/components/cms/staff-link";
import { env } from "@/lib/env";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { Logo } from "./logo";

// Sticky with an opaque background, CSS only (Phase 1 spec, D14). Being sticky also makes it the
// containing block for the mobile nav panel, which opens below it. The staff admin icon is
// rendered only where the CMS is on, so production pages carry none of it until Phase 34
// (Phase 24 spec, D13, amended 2026-10-26).
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink">
      <div className="container-page flex items-center justify-between gap-6 py-3">
        <Logo />
        <div className="flex items-center gap-4 md:gap-8">
          <nav aria-label="Main" className="hidden md:block">
            <NavLinks className="flex items-center gap-8" />
          </nav>
          {env.cms && <StaffLink />}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
