import type { Pillar } from "@/content/services";
import { block } from "@/lib/content/block";

// A pillar's process steps as arrowed names (Phase 3 spec, D4). Used by the homepage strip and
// the services index (Phase 4 spec, D4). The arrows are decoration, hidden from the keyed-text check.
export async function StepList({ pillar, className }: { pillar: Pillar; className?: string }) {
  const steps = await Promise.all(
    pillar.stepKeys.map(async (key) => ({ key, label: await block(key) })),
  );
  return (
    <ol
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 font-display font-extrabold ${className ?? ""}`}
    >
      {steps.map((step, i) => (
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
  );
}
