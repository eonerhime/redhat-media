import Link from "next/link";
import { block } from "@/lib/content/block";
import type { PillarGroup } from "@/lib/content/services";

// One card per visible pillar, each listing its visible services (Phase 3 spec, D1, D3).
export async function PillarCards({ groups }: { groups: readonly PillarGroup[] }) {
  const heading = await block("home.services.heading");
  return (
    <section aria-labelledby="pillars-heading" className="container-page py-16">
      <h2 id="pillars-heading" className="font-display text-display-2 font-extrabold">
        {heading}
      </h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {groups.map((group) => (
          <PillarCard key={group.pillar.id} group={group} />
        ))}
      </div>
    </section>
  );
}

async function PillarCard({ group: { pillar, services } }: { group: PillarGroup }) {
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
  return (
    // muted text stays on the ink surface at ≥ 16px (tech-stack.md → Design tokens).
    <article className="flex flex-col rounded-xl border border-t-4 border-line border-t-brand bg-ink p-6">
      <h3 className="font-display text-2xl font-extrabold">{name}</h3>
      <p className="mt-3 text-base text-muted">{summary}</p>
      <ul className="mt-6 flex flex-col gap-5 border-t border-line pt-6">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/services/${item.slug}`}
              className="font-semibold underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:decoration-brand"
            >
              {item.name}
            </Link>
            <p className="mt-1 text-base text-muted">{item.summary}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
