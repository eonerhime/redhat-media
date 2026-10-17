import { PortfolioSkeleton } from "@/components/portfolio/portfolio-skeleton";

// Shown while a full navigation to /portfolio streams (Phase 10 spec, D5). The page's own
// <Suspense> fallback covers the listing once the shell is in place (Phase 11 spec, D2).
export default function PortfolioLoading() {
  return (
    <div className="container-page py-16 md:py-24">
      <PortfolioSkeleton />
    </div>
  );
}
