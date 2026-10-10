import { block, type BlockKey } from "@/lib/content/block";

// A service page list ("What's included", "What you get") on the Phase 4 card surface
// (Phase 5 spec, D4). Text stays fg on ink; only the markers are brand.
export async function ItemList({
  id,
  headingKey,
  itemKeys,
}: {
  id: string;
  headingKey: BlockKey;
  itemKeys: readonly BlockKey[];
}) {
  const [heading, items] = await Promise.all([
    block(headingKey),
    Promise.all(itemKeys.map(async (key) => ({ key, text: await block(key) }))),
  ]);
  const headingId = `${id}-heading`;
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-xl border border-t-4 border-line border-t-brand bg-ink p-6 md:p-8"
    >
      <h2 id={headingId} className="font-display text-3xl font-extrabold">
        {heading}
      </h2>
      <ul className="mt-6 list-disc space-y-3 pl-5 text-lg marker:text-brand">
        {items.map((item) => (
          <li key={item.key}>{item.text}</li>
        ))}
      </ul>
    </section>
  );
}
