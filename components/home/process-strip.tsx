import { StepList } from "@/components/shared/step-list";
import { block } from "@/lib/content/block";
import type { PillarGroup } from "@/lib/content/services";

// One strip per visible pillar; steps are names only (Phase 3 spec, D4).
export async function ProcessStrip({ groups }: { groups: readonly PillarGroup[] }) {
  const heading = await block("home.process.heading");
  const rows = await Promise.all(
    groups.map(async ({ pillar }) => ({ pillar, name: await block(pillar.nameKey) })),
  );
  return (
    <section aria-labelledby="process-heading" className="border-y border-line">
      <div className="container-page py-16">
        <h2 id="process-heading" className="font-display text-display-2 font-extrabold">
          {heading}
        </h2>
        <dl className="mt-10 grid gap-8 md:grid-cols-3">
          {rows.map((row) => (
            <div key={row.pillar.id}>
              <dt className="text-base font-semibold text-muted uppercase">{row.name}</dt>
              <dd className="mt-3">
                <StepList pillar={row.pillar} className="text-2xl" />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
