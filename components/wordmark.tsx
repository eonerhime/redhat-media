import Link from "next/link";

// CSS wordmark carried over from the static site; no logo file exists (Phase 1 spec, D1).
// "RED" stays ≥ 24px so brand red on ink counts as large text (3.97:1).
export function Wordmark() {
  return (
    <Link
      href="/"
      aria-label="RedHat Media home"
      className="inline-flex flex-col items-center font-display leading-none"
    >
      <span className="text-2xl font-black tracking-tight md:text-3xl">
        <span className="text-brand">RED</span>
        <span className="text-muted">HAT</span>
      </span>
      <span className="mt-1 pl-[0.5em] text-[0.625rem] font-bold tracking-[0.5em] text-fg md:text-xs">
        MEDIA
      </span>
    </Link>
  );
}
