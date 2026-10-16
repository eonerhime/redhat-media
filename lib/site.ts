// Site name, nav and contact details. These are data, not copy, so they stay here rather than
// behind block() (Phase 2 spec, D9, which supersedes Phase 1 spec D12).

export const siteName = "RedHat Media";

export type NavItem = { href: string; label: string };

// Every page in the nav exists from Phase 13. About comes first (Phase 1 spec, D3, amended 2026-10-16).
export const navItems = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/contact", label: "Contact" },
] as const satisfies readonly NavItem[];

export const contact = {
  email: "redhatmediang@gmail.com",
  phoneDisplay: "0802 658 1200",
  phoneHref: "tel:+2348026581200",
  // For callers outside Nigeria, and WhatsApp on the same number (Phase 13 spec, D2, owner answer C).
  phoneInternational: "+234 802 658 1200",
  whatsappHref: "https://wa.me/2348026581200",
  location: "Lagos, Nigeria",
  hours: "Monday to Friday, 9am to 6pm (WAT)",
  registration: "RC 1379619",
} as const;

// The same facts as `contact`, in the shape structured data needs (Phase 14 spec, D6). City only,
// no street address (owner answer A); `contact.hours` is the display form of `openingHours`.
export const business = {
  address: { locality: "Lagos", region: "Lagos", country: "NG" },
  areaServed: "Nigeria",
  openingHours: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "09:00",
    closes: "18:00",
  },
  /** On white, for search engines (owner answer B); the header uses the light-on-dark logo.png. */
  logoOnLight: "/brand/logo-on-light.png",
} as const;

/** A `mailto:` link to the team, with a pre-filled subject when one is given (Phase 13 spec, D5). */
export function mailtoHref(subject?: string) {
  const href = `mailto:${contact.email}`;
  return subject ? `${href}?subject=${encodeURIComponent(subject)}` : href;
}

// The public error boundary's text (app/(public)/error.tsx). Fixed, not block() keys: the boundary is
// a client component, and from Phase 27 block() reads the database, which may be what failed
// (Phase 10 spec, D6).
export const errorCopy = {
  heading: "Something went wrong",
  body: "This page could not be shown. Please try again.",
  retry: "Try again",
} as const;
