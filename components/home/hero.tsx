import { Editable } from "@/components/cms/editable";
import { EditButton } from "@/components/cms/edit-button";
import { EditableImage } from "@/components/cms/editable-image";
import { ButtonLink } from "@/components/shared/button-link";
import { block } from "@/lib/content/block";

// The image sits beside the text from lg and under the button below that (Phase 28 spec, D1).
export async function Hero() {
  const [tagline, subtext, cta] = await Promise.all([
    block("home.hero.tagline"),
    block("home.hero.subtext"),
    block("home.cta.button"),
  ]);
  return (
    <section className="container-page grid gap-12 py-16 md:py-24 lg:grid-cols-[3fr_2fr] lg:items-center lg:gap-16">
      <div>
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
      </div>
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-line lg:max-w-none">
        <EditableImage slot="home.hero" preload />
      </div>
    </section>
  );
}
