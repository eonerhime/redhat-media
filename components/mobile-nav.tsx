"use client";

import { useEffect, useRef, useState } from "react";
import { NavLinks } from "./nav-links";

// Below md (768px) only (Phase 1 spec, D13).
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((value) => !value)}
        className="flex size-11 items-center justify-center rounded border border-line"
      >
        <span className="sr-only">Menu</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      <nav
        id="mobile-nav"
        aria-label="Main"
        className={`absolute inset-x-0 top-full z-40 border-b border-line bg-ink motion-safe:transition-[opacity,translate,visibility] motion-safe:duration-200 ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <NavLinks
          className="container-page flex flex-col py-2"
          linkClassName="block py-3 text-lg"
          onNavigate={() => setOpen(false)}
        />
      </nav>
    </div>
  );
}
