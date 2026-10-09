import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { Wordmark } from "./wordmark";

export function SiteHeader() {
  return (
    <header className="relative border-b border-line">
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
