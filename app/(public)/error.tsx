"use client";

import { errorCopy } from "@/lib/site";

// The error boundary for every public route (Phase 10 spec, D6). Its copy is fixed text, because
// a client component cannot call block(), and block() may read the store that failed. `retry`
// re-fetches the server render and then resets the boundary (Next 16.4); `reset` alone would only
// re-render the same failed payload.
export default function PublicError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <section className="container-page py-16 md:py-24">
      <h1 className="font-display text-display-2 font-extrabold">{errorCopy.heading}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{errorCopy.body}</p>
      {/* The ButtonLink look: fg on brand-deep is 5.03:1 (Phase 3 spec, D9). */}
      <button
        type="button"
        onClick={() => retry()}
        className="mt-8 inline-flex items-center rounded-md border border-brand-deep bg-brand-deep px-6 py-3 font-semibold text-fg transition-transform hover:-translate-y-0.5"
      >
        {errorCopy.retry}
      </button>
    </section>
  );
}
