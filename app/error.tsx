"use client";

import { ErrorView } from "@/components/shared/error-view";

// Errors above the public pages: in the public layout itself (header, footer) or in a route group
// without its own boundary. It renders inside the root layout, without the header, which may be
// what failed (Phase 15 spec, D2).
export default function RootError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main id="main" className="flex-1">
      <ErrorView onRetry={retry} home />
    </main>
  );
}
