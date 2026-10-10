import { block } from "@/lib/content/block";
import { ButtonLink } from "./button-link";

export async function Hero() {
  const [tagline, subtext, cta] = await Promise.all([
    block("home.hero.tagline"),
    block("home.hero.subtext"),
    block("home.cta.button"),
  ]);
  return (
    <section className="container-page py-16 md:py-24">
      <h1 className="max-w-4xl font-display text-display-1 font-black tracking-tight">{tagline}</h1>
      <p className="mt-6 max-w-2xl text-lg text-muted">{subtext}</p>
      <div className="mt-10">
        <ButtonLink href="/contact">{cta}</ButtonLink>
      </div>
    </section>
  );
}
