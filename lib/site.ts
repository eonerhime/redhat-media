// Shell copy for Phase 1. Phase 2 moves these strings behind block() (Phase 1 spec, D12).

export const siteName = "RedHat Media";

export type NavItem = { href: string; label: string };

// Pages land in Phases 4–13; until then these links 404 on previews (Phase 1 spec, D3).
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
