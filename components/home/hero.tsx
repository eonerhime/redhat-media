import { Editable } from "@/components/cms/editable";
import { EditButton } from "@/components/cms/edit-button";
import { ButtonLink } from "@/components/shared/button-link";
import { block } from "@/lib/content/block";

export async function Hero() {
  const [tagline, subtext, cta] = await Promise.all([
    block("home.hero.tagline"),
    block("home.hero.subtext"),
    block("home.cta.button"),
  ]);
  return (
    <section className="container-page py-16 md:py-24">
      <h1 className="max-w-4xl font-display text-display-1 font-black tracking-tight">
        <Editable blockKey="home.hero.tagline" value={tagline} />
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted">
        <Editable blockKey="home.hero.subtext" value={subtext} />
      </p>
      <div className="mt-10">
        <ButtonLink href="/contact">{cta}</ButtonLink>
        <EditButton blockKey="home.cta.button" value={cta} />
      </div>
    </section>
  );
}
