import type { Service } from "@/content/services";
import { block } from "@/lib/content/block";
import { contactHref } from "@/lib/content/services";
import { ButtonLink } from "./button-link";

// With a service, the button pre-fills the inquiry stepper with it while it is visible (Phase 21
// spec, D3, D8). The copy is the same either way (D6).
export async function Cta({ service }: { service?: Service } = {}) {
  const [heading, body, button, href] = await Promise.all([
    block("home.cta.heading"),
    block("home.cta.body"),
    block("home.cta.button"),
    contactHref(service),
  ]);
  return (
    <section aria-labelledby="cta-heading" className="container-page py-16 md:py-24">
      <h2 id="cta-heading" className="font-display text-display-2 font-extrabold">
        {heading}
      </h2>
      <p className="mt-4 max-w-2xl text-lg text-muted">{body}</p>
      <div className="mt-8">
        <ButtonLink href={href}>{button}</ButtonLink>
      </div>
    </section>
  );
}
