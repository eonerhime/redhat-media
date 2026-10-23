import { PortfolioDetailSkeleton } from "@/components/portfolio/portfolio-skeleton";

// Shown while a navigation to a detail page streams (Phase 12 spec, D3).
export default function PortfolioItemLoading() {
  return <PortfolioDetailSkeleton />;
}
