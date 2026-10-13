import { isHttpsUrl } from "@/lib/validation/https-url";

// The only way to link off-site (Phase 9 spec, D4). Lint allows target="_blank"
// only here and in the video facade. The href is checked again on render, so a
// row edited outside the validated paths can never become a link.
export function ExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (!isHttpsUrl(href)) {
    console.warn(`ExternalLink: not an https link, rendered as text: ${JSON.stringify(href)}`);
    return <span className={className}>{children}</span>;
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
