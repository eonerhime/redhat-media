import { errorCopy } from "@/lib/site";

// The error boundaries' view (Phase 10 spec, D6; Phase 15 spec, D2). `home` adds a plain link to
// `/` for the root boundaries, which render without the header. It is a plain <a>, so it reloads
// the page instead of going through a client router that may be what failed.
// `headingId` lets the portfolio modal's dialog be named by the heading (Phase 22 spec, D8).
export function ErrorView({
  onRetry,
  home = false,
  headingId,
}: {
  onRetry: () => void;
  home?: boolean;
  headingId?: string;
}) {
  return (
    <section className="container-page py-16 md:py-24" data-testid="error-view">
      <h1 id={headingId} className="font-display text-display-2 font-extrabold">
        {errorCopy.heading}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{errorCopy.body}</p>
      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
        {/* The ButtonLink look: fg on brand-deep is 5.03:1 (Phase 3 spec, D9). */}
        <button
          type="button"
          onClick={() => onRetry()}
          className="inline-flex items-center rounded-md border border-brand-deep bg-brand-deep px-6 py-3 font-semibold text-fg transition-transform hover:-translate-y-0.5"
        >
          {errorCopy.retry}
        </button>
        {home ? (
          // eslint-disable-next-line @next/next/no-html-link-for-pages -- a full reload, see above
          <a href="/" className="font-semibold underline underline-offset-4">
            {errorCopy.home}
          </a>
        ) : null}
      </div>
    </section>
  );
}
