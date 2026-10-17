import Link from "next/link";

const className =
  "inline-flex items-center rounded-md border border-brand-deep bg-brand-deep px-6 py-3 font-semibold text-fg transition-transform hover:-translate-y-0.5";

// Primary CTA. fg on brand-deep is 5.03:1; the fill never switches to brand, where fg drops to
// 4.02:1 (Phase 3 spec, D9). Routes go through next/link; any other scheme (mailto:) is a plain
// <a>, so it never passes through the client router (Phase 13 spec, D5).
export function ButtonLink({ href, children }: { href: string; children: React.ReactNode }) {
  if (!href.startsWith("/")) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
