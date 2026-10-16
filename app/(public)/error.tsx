"use client";

import { ErrorView } from "@/components/shared/error-view";

// The error boundary for every public route (Phase 10 spec, D6). Its copy is fixed text, because
// a client component cannot call block(), and block() may read the store that failed. `retry`
// re-fetches the server render and then resets the boundary (Next 16.4); `reset` alone would only
// re-render the same failed payload.
export default function PublicError({ retry }: { error: unknown; retry: () => void }) {
  return <ErrorView onRetry={retry} />;
}
