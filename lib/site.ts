// Site name, nav and contact details. These are data, not copy, so they stay here rather than
// behind block() (Phase 2 spec, D9, which supersedes Phase 1 spec D12).

export const siteName = "RedHat Media";

export type NavItem = { href: string; label: string };

// Pages land in Phases 4–13; until then a link to a page not yet built 404s on previews
// (Phase 1 spec, D3). Only /contact is left (Phase 13).
export const navItems = [
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const satisfies readonly NavItem[];

export const contact = {
  email: "redhatmediang@gmail.com",
  phoneDisplay: "0802 658 1200",
  phoneHref: "tel:+2348026581200",
  location: "Lagos, Nigeria",
  registration: "RC 1379619",
} as const;

// The public error boundary's text (app/(public)/error.tsx). Fixed, not block() keys: the boundary is
// a client component, and from Phase 27 block() reads the database, which may be what failed
// (Phase 10 spec, D6).
export const errorCopy = {
  heading: "Something went wrong",
  body: "This page could not be shown. Please try again.",
  retry: "Try again",
} as const;
