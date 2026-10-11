import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { Wordmark } from "./wordmark";

// Sticky with an opaque background, CSS only (Phase 1 spec, D14). Being sticky also makes it the
// containing block for the mobile nav panel, which opens below it.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink">
      <div className="container-page flex items-center justify-between gap-6 py-4">
        <Wordmark />
        <nav aria-label="Main" className="hidden md:block">
          <NavLinks className="flex items-center gap-8" />
        </nav>
        <MobileNav />
      </div>
    </header>
  );
}
