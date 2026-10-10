import { block } from "@/lib/content/block";
import { ButtonLink } from "./button-link";

export async function Cta() {
  const [heading, body, button] = await Promise.all([
    block("home.cta.heading"),
    block("home.cta.body"),
    block("home.cta.button"),
  ]);
  return (
    <section aria-labelledby="cta-heading" className="container-page py-16 md:py-24">
      <h2 id="cta-heading" className="font-display text-display-2 font-extrabold">
        {heading}
      </h2>
      <p className="mt-4 max-w-2xl text-lg text-muted">{body}</p>
      <div className="mt-8">
        <ButtonLink href="/contact">{button}</ButtonLink>
      </div>
    </section>
  );
}
