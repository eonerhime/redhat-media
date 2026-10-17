import Link from "next/link";
import { block } from "@/lib/content/block";

// Says plainly that work is coming: no fake tiles. Must show real items, link to a populated
// /portfolio, or be removed before the Milestone 1 release (Phase 3 spec, D5).
export async function FeaturedWork() {
  const [heading, body, link] = await Promise.all([
    block("home.work.heading"),
    block("home.work.body"),
    block("home.work.link"),
  ]);
  return (
    <section aria-labelledby="work-heading" className="container-page py-16">
      <h2 id="work-heading" className="font-display text-display-2 font-extrabold">
        {heading}
      </h2>
      <p className="mt-4 max-w-2xl text-lg text-muted">{body}</p>
      <Link
        href="/portfolio"
        className="mt-6 inline-block font-semibold underline decoration-brand decoration-2 underline-offset-8"
      >
        {link}
      </Link>
    </section>
  );
}
