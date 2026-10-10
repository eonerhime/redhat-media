import { block } from "@/lib/content/block";
import type { PillarGroup } from "@/lib/content/services";

// One strip per visible pillar; steps are names only (Phase 3 spec, D4).
export async function ProcessStrip({ groups }: { groups: readonly PillarGroup[] }) {
  const heading = await block("home.process.heading");
  const rows = await Promise.all(
    groups.map(async ({ pillar }) => ({
      id: pillar.id,
      name: await block(pillar.nameKey),
      steps: await Promise.all(
        pillar.stepKeys.map(async (key) => ({ key, label: await block(key) })),
      ),
    })),
  );
  return (
    <section aria-labelledby="process-heading" className="border-y border-line">
      <div className="container-page py-16">
        <h2 id="process-heading" className="font-display text-display-2 font-extrabold">
          {heading}
        </h2>
        <dl className="mt-10 grid gap-8 md:grid-cols-3">
          {rows.map((row) => (
            <div key={row.id}>
              <dt className="text-base font-semibold text-muted uppercase">{row.name}</dt>
              <dd className="mt-3">
                <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 font-display text-2xl font-extrabold">
                  {row.steps.map((step, i) => (
                    <li key={step.key} className="flex items-center gap-3">
                      {i > 0 && (
                        <span aria-hidden="true" className="text-brand">
                          →
                        </span>
                      )}
                      {step.label}
                    </li>
                  ))}
                </ol>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
