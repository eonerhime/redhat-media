"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/site";

type NavLinksProps = {
  className?: string;
  linkClassName?: string;
  onNavigate?: () => void;
};

export function NavLinks({ className, linkClassName, onNavigate }: NavLinksProps) {
  const pathname = usePathname();
  return (
    <ul className={className}>
      {navItems.map(({ href, label }) => {
        const current = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={current ? "page" : undefined}
              onClick={onNavigate}
              className={`font-medium underline decoration-2 underline-offset-8 transition-colors ${
                current ? "decoration-brand" : "decoration-transparent hover:decoration-brand"
              } ${linkClassName ?? ""}`}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
