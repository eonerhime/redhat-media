import Link from "next/link";
import { ButtonLink } from "@/components/shared/button-link";
import { notFoundCopy } from "@/lib/site";

// The one 404 view, for notFound() in public pages and for unmatched URLs (Phase 15 spec, D1). It
// points the visitor back towards the work and an inquiry.
export function NotFoundView() {
  return (
    <section className="container-page py-16 md:py-24" data-testid="not-found">
      <h1 className="font-display text-display-2 font-extrabold">{notFoundCopy.heading}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{notFoundCopy.body}</p>
      <nav aria-label="Helpful links" className="mt-8">
        <ul className="flex flex-wrap items-center gap-x-8 gap-y-4">
          {notFoundCopy.links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="font-semibold underline underline-offset-4">
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <ButtonLink href={notFoundCopy.cta.href}>{notFoundCopy.cta.label}</ButtonLink>
          </li>
        </ul>
      </nav>
    </section>
  );
}
