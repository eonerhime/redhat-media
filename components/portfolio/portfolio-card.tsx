import { MediaImage } from "@/components/media/media-image";
import { ExternalLink } from "@/components/shared/external-link";
import { block } from "@/lib/content/block";
import { serviceByCategory } from "@/lib/content/services";
import type { PortfolioCard as Card } from "@/lib/portfolio/read-core";

// The cards sit one, two or three to a row (D4).
const COVER_SIZES = "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw";

/**
 * One portfolio item on the Phase 3 card surface (Phase 10 spec, D4). The card
 * lifts and its cover zooms on hover or keyboard focus, only when motion is
 * allowed. Title, summary and tech are database content; the rest is copy.
 */
export async function PortfolioCard({
  card,
  headingLevel,
  preload = false,
}: {
  card: Card;
  /** 2 on /portfolio, 3 under a service page's "Related work" heading. */
  headingLevel: 2 | 3;
  /** Only the first card on /portfolio, which may be the LCP image on phones. */
  preload?: boolean;
}) {
  const [badge, techLabel, liveLabel] = await Promise.all([
    block(serviceByCategory(card.category).nameKey),
    block("portfolio.tech"),
    block("portfolio.live"),
  ]);
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const techId = `${card.id}-tech`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-t-4 border-line border-t-brand bg-ink transition-transform duration-200 motion-safe:focus-within:-translate-y-1 motion-safe:hover:-translate-y-1">
      <div className="overflow-hidden">
        {card.cover ? (
          <MediaImage
            publicId={card.cover.publicId}
            alt={card.cover.alt}
            aspect="16/10"
            sizes={COVER_SIZES}
            preload={preload}
            className="transition-transform duration-200 motion-safe:group-focus-within:scale-[1.04] motion-safe:group-hover:scale-[1.04]"
          />
        ) : (
          <div aria-hidden="true" className="aspect-[16/10] border-b border-line" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        {/* fg text with a brand-deep edge: 3.18:1 against ink, enough for a UI part. */}
        <p className="self-start rounded-full border border-brand-deep px-3 py-1 text-sm font-bold tracking-wider uppercase">
          {badge}
        </p>
        <Heading className="mt-4 font-display text-2xl font-extrabold">{card.title}</Heading>
        {/* muted stays at ≥ 16px on ink (tech-stack.md → Design tokens). */}
        <p className="mt-3 text-base text-muted">{card.summary}</p>
        <p id={techId} className="sr-only">
          {techLabel}
        </p>
        <ul aria-labelledby={techId} className="mt-5 flex flex-wrap gap-2">
          {card.techStack.map((tech) => (
            <li key={tech} className="rounded-full border border-line px-3 py-1 text-sm">
              {tech}
            </li>
          ))}
        </ul>
        {card.liveUrl ? (
          <div className="mt-auto pt-6">
            <ExternalLink
              href={card.liveUrl}
              className="font-semibold underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:decoration-brand"
            >
              {liveLabel}
              <span
                aria-hidden="true"
                className="ml-1 text-xl leading-none font-extrabold text-brand"
              >
                ↗
              </span>
            </ExternalLink>
          </div>
        ) : null}
      </div>
    </article>
  );
}
