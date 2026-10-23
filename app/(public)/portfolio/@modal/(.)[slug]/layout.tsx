import { PortfolioModal } from "@/components/portfolio/portfolio-modal";
import { block } from "@/lib/content/block";

// The dialog wraps this segment's loading, error and page states, so it opens at once and a failure
// stays inside it (Phase 22 spec, D4, D8).
export default async function PortfolioModalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortfolioModal closeLabel={await block("portfolio.modal.close")}>{children}</PortfolioModal>
  );
}
