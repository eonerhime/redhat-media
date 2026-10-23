import { MODAL_LABEL_ID } from "@/components/portfolio/modal-label";
import { PortfolioDetailSkeleton } from "@/components/portfolio/portfolio-skeleton";

// The dialog opens at once with the detail skeleton, named "Loading the project" (Phase 22 spec, D8).
export default function PortfolioModalLoading() {
  return <PortfolioDetailSkeleton labelId={MODAL_LABEL_ID} />;
}
