import type { Metadata } from "next";
import { block } from "@/lib/content/block";
import { pageMetadata } from "@/lib/seo/metadata";
import { contact, mailtoHref, siteName } from "@/lib/site";

// Static, keyed copy (Phase 18 spec, D11, Appendix B). It ships in production even while the
// inquiry form is off, so the owner can review it there.
export async function generateMetadata(): Promise<Metadata> {
  const [heading, description] = await Promise.all([
    block("privacy.heading"),
    block("privacy.meta.description"),
  ]);
  return pageMetadata({ title: `${heading} | ${siteName}`, description, path: "/privacy" });
}

// In Appendix B order; each id names a heading/body key pair.
const SECTIONS = [
  "who",
  "collect",
  "why",
  "basis",
  "processors",
  "retention",
  "rights",
  "contact",
] as const;

/** The site email inside a body becomes a mailto: link; the rest stays plain text. */
function withEmailLink(text: string) {
  const [before, ...rest] = text.split(contact.email);
  if (rest.length === 0) return text;
  return (
    <>
      {before}
      <a
        href={mailtoHref()}
        className="font-semibold wrap-anywhere underline decoration-brand decoration-2 underline-offset-4"
      >
        {contact.email}
      </a>
      {rest.join(contact.email)}
    </>
  );
}

export default async function Privacy() {
  const [heading, updated, sections] = await Promise.all([
    block("privacy.heading"),
    block("privacy.updated"),
    Promise.all(
      SECTIONS.map((id) =>
        Promise.all([block(`privacy.${id}.heading`), block(`privacy.${id}.body`)]),
      ),
    ),
  ]);

  return (
    <article className="container-page py-16 md:py-24">
      <h1 className="max-w-4xl font-display text-display-1 font-black tracking-tight">{heading}</h1>
      <p className="mt-6 text-base text-muted">{updated}</p>
      <div className="mt-12 max-w-3xl space-y-10">
        {sections.map(([sectionHeading, body], i) => {
          const id = `privacy-${SECTIONS[i]}`;
          return (
            <section key={id} aria-labelledby={id}>
              <h2 id={id} className="font-display text-2xl font-extrabold">
                {sectionHeading}
              </h2>
              <p className="mt-3 text-lg">{withEmailLink(body)}</p>
            </section>
          );
        })}
      </div>
    </article>
  );
}
