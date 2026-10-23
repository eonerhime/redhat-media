"use client";

import { MODAL_LABEL_ID } from "@/components/portfolio/modal-label";
import { ErrorView } from "@/components/shared/error-view";

// A failure inside the modal stays inside the dialog, so Close still returns to the grid (Phase 22
// spec, D8). Same fixed copy and retry as app/(public)/error.tsx.
export default function PortfolioModalError({ retry }: { error: unknown; retry: () => void }) {
  return <ErrorView onRetry={retry} headingId={MODAL_LABEL_ID} />;
}
