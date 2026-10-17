import Link from "next/link";
import { MediaImage } from "@/components/media/media-image";
import { VideoEmbed } from "@/components/media/video-embed";
import { Cta } from "@/components/shared/cta";
import { ExternalLink } from "@/components/shared/external-link";
import { block } from "@/lib/content/block";
import { serviceByCategory } from "@/lib/content/services";
import type { PortfolioDetail as Detail, PortfolioImage } from "@/lib/portfolio/read-core";
import { Lightbox, LightboxTrigger, type LightboxImage } from "./lightbox";

// The hero spans the container (72rem less 2rem padding each side); gallery tiles are half that.
const HERO_SIZES = "(min-width: 72rem) 68rem, 100vw";
const TILE_SIZES = "(min-width: 72rem) 34rem, (min-width: 768px) 50vw, 100vw";

const linkClass =
  "font-semibold underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:decoration-brand";

/** Brand on ink is a large-text pairing only, so markers are 20px extra-bold (Phase 5 page). */
function Marker({ children }: { children: string }) {
  return (
    <span aria-hidden="true" className="text-xl leading-none font-extrabold text-brand">
      {children}
    </span>
  );
}

async function BackLink() {
  return (
    <Link href="/portfolio" className={`inline-flex items-center gap-2 ${linkClass}`}>
      <Marker>←</Marker>
      {await block("portfolio.detail.back")}
    </Link>
  );
}

function AsideSection({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="font-display text-xl font-extrabold">
        {heading}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * One portfolio item's page body (Phase 12 spec, D4–D6): heading, hero, story and highlights, the
 * facts aside, the gallery and the CTA. /portfolio/[slug] and the /dev fixture page share it.
 * Images open the lightbox; videos play in place.
 */
export async function PortfolioDetail({ item }: { item: Detail }) {
  const [
    eyebrow,
    highlightsHeading,
    techHeading,
    linksHeading,
    liveLabel,
    repoLabel,
    creditHeading,
    clientHeading,
    galleryHeading,
    viewLabel,
    lightboxLabel,
    closeLabel,
    previousLabel,
    nextLabel,
    positionLabel,
  ] = await Promise.all([
    block(serviceByCategory(item.category).nameKey),
    block("portfolio.detail.highlights"),
    block("portfolio.tech"),
    block("portfolio.detail.links"),
    block("portfolio.live"),
    block("portfolio.detail.repo"),
    block("portfolio.detail.credit"),
    block("portfolio.detail.client"),
    block("portfolio.detail.gallery"),
    block("portfolio.detail.view"),
    block("portfolio.detail.lightbox.label"),
    block("portfolio.detail.lightbox.close"),
    block("portfolio.detail.lightbox.previous"),
    block("portfolio.detail.lightbox.next"),
    block("portfolio.detail.lightbox.position"),
  ]);

  // The lightbox holds the hero, then the gallery images, in that order (D6).
  const images: PortfolioImage[] = [
    ...(item.hero ? [item.hero] : []),
    ...item.gallery.filter((media) => media.kind === "image"),
  ];
  const indexOf = (image: PortfolioImage) => images.indexOf(image);
  const viewLabelFor = (image: PortfolioImage) => viewLabel.replace("{alt}", image.alt);
  const lightboxImages: LightboxImage[] = images.map((image) => ({
    id: image.id,
    text: image.caption ?? image.alt,
    image: <MediaImage publicId={image.publicId} alt={image.alt} fit="contain" sizes="100vw" />,
  }));

  return (
    <Lightbox
      images={lightboxImages}
      labels={{
        label: lightboxLabel,
        close: closeLabel,
        previous: previousLabel,
        next: nextLabel,
        position: positionLabel,
      }}
    >
      <article data-testid="portfolio-detail">
        <header className="container-page pt-16 pb-12 md:pt-24">
          <BackLink />
          {/* muted stays at ≥ 16px on ink (tech-stack.md → Design tokens). */}
          <p className="mt-8 text-base font-semibold tracking-widest text-muted uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-display-1 font-black tracking-tight">
            {item.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted">{item.summary}</p>
          {item.hero ? (
            <LightboxTrigger
              index={0}
              label={viewLabelFor(item.hero)}
              className="mt-10 overflow-hidden rounded-xl border border-line"
            >
              <MediaImage
                publicId={item.hero.publicId}
                alt={item.hero.alt}
                aspect="16/10"
                sizes={HERO_SIZES}
                preload
              />
            </LightboxTrigger>
          ) : null}
        </header>

        <div className="container-page grid gap-12 border-t border-line py-16 lg:grid-cols-[2fr_1fr]">
          <div>
            <p className="max-w-3xl text-lg">{item.description}</p>
            <section aria-labelledby="highlights-heading" className="mt-12">
              <h2 id="highlights-heading" className="font-display text-display-2 font-extrabold">
                {highlightsHeading}
              </h2>
              <ul className="mt-6 list-disc space-y-3 pl-5 text-lg marker:text-brand">
                {item.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="space-y-8 rounded-xl border border-t-4 border-line border-t-brand bg-ink p-6 md:p-8 lg:self-start">
            <AsideSection id="tech-heading" heading={techHeading}>
              <ul className="flex flex-wrap gap-2">
                {item.techStack.map((tech) => (
                  <li key={tech} className="rounded-full border border-line px-3 py-1 text-sm">
                    {tech}
                  </li>
                ))}
              </ul>
            </AsideSection>
            {item.liveUrl || item.repoUrl ? (
              <AsideSection id="links-heading" heading={linksHeading}>
                <ul className="space-y-2">
                  {item.liveUrl ? (
                    <li>
                      <ExternalLink href={item.liveUrl} className={linkClass}>
                        {liveLabel} <Marker>↗</Marker>
                      </ExternalLink>
                    </li>
                  ) : null}
                  {item.repoUrl ? (
                    <li>
                      <ExternalLink href={item.repoUrl} className={linkClass}>
                        {repoLabel} <Marker>↗</Marker>
                      </ExternalLink>
                    </li>
                  ) : null}
                </ul>
              </AsideSection>
            ) : null}
            {item.credit ? (
              <AsideSection id="credit-heading" heading={creditHeading}>
                <p className="text-base" data-testid="portfolio-credit">
                  {item.creditUrl ? (
                    <ExternalLink href={item.creditUrl} className={linkClass}>
                      {item.credit} <Marker>↗</Marker>
                    </ExternalLink>
                  ) : (
                    item.credit
                  )}
                </p>
              </AsideSection>
            ) : null}
            {item.client ? (
              <AsideSection id="client-heading" heading={clientHeading}>
                <p className="text-base">{item.client}</p>
              </AsideSection>
            ) : null}
          </aside>
        </div>

        {item.gallery.length > 0 ? (
          <section
            aria-labelledby="gallery-heading"
            className="container-page border-t border-line py-16"
          >
            <h2 id="gallery-heading" className="font-display text-display-2 font-extrabold">
              {galleryHeading}
            </h2>
            <ul className="mt-8 grid gap-6 md:grid-cols-2" data-testid="portfolio-gallery">
              {item.gallery.map((media) => (
                <li key={media.id} data-kind={media.kind}>
                  <figure>
                    {media.kind === "image" ? (
                      <LightboxTrigger
                        index={indexOf(media)}
                        label={viewLabelFor(media)}
                        className="overflow-hidden rounded-xl border border-line"
                      >
                        <MediaImage
                          publicId={media.publicId}
                          alt={media.alt}
                          aspect="16/10"
                          sizes={TILE_SIZES}
                        />
                      </LightboxTrigger>
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-line">
                        <VideoEmbed
                          video={media.video}
                          title={media.title ?? item.title}
                          sizes={TILE_SIZES}
                        />
                      </div>
                    )}
                    {media.caption ? (
                      <figcaption className="mt-3 text-base text-muted">{media.caption}</figcaption>
                    ) : null}
                  </figure>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
      <div className="border-t border-line">
        <Cta />
      </div>
    </Lightbox>
  );
}

/** The detail route when the portfolio read failed (D3): the Phase 10 message and a way back. */
export async function PortfolioDetailUnavailable() {
  const message = await block("portfolio.unavailable");
  return (
    <section className="container-page py-16 md:py-24" data-testid="portfolio-detail-unavailable">
      <BackLink />
      <p role="status" className="mt-8 max-w-2xl text-lg text-muted">
        {message}
      </p>
    </section>
  );
}
