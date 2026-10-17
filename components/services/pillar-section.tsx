import Link from "next/link";
import { StepList } from "@/components/shared/step-list";
import { block } from "@/lib/content/block";
import type { PillarGroup } from "@/lib/content/services";

// One section per visible pillar, with a card per visible service (Phase 4 spec, D1).
export async function PillarSection({ group: { pillar, services } }: { group: PillarGroup }) {
  const [name, summary, items] = await Promise.all([
    block(pillar.nameKey),
    block(pillar.summaryKey),
    Promise.all(
      services.map(async (s) => ({
        slug: s.slug,
        name: await block(s.nameKey),
        summary: await block(s.summaryKey),
      })),
    ),
  ]);
  const headingId = `pillar-${pillar.id}`;
  return (
    <section aria-labelledby={headingId} className="container-page border-t border-line py-16">
      <h2 id={headingId} className="font-display text-display-2 font-extrabold">
        {name}
      </h2>
      <p className="mt-4 max-w-2xl text-lg text-muted">{summary}</p>
      <StepList pillar={pillar} className="mt-6 text-xl" />
      <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          // muted text stays on the ink surface at ≥ 16px (tech-stack.md → Design tokens).
          <li
            key={item.slug}
            className="flex flex-col rounded-xl border border-t-4 border-line border-t-brand bg-ink p-6"
          >
            <h3 className="font-display text-2xl font-extrabold">
              <Link
                href={`/services/${item.slug}`}
                className="underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:decoration-brand"
              >
                {item.name}
              </Link>
            </h3>
            <p className="mt-3 text-base text-muted">{item.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
