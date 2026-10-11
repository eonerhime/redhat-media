import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Cta } from "@/components/shared/cta";
import { StepList } from "@/components/shared/step-list";
import { block } from "@/lib/content/block";
import { visiblePillars } from "@/lib/content/services";
import { contact, siteName } from "@/lib/site";

// Title is the heading plus the site name until Phase 14 adds a template (Phase 6 spec, D8).
export async function generateMetadata(): Promise<Metadata> {
  const [heading, description] = await Promise.all([
    block("about.heading"),
    block("about.meta.description"),
  ]);
  return { title: `${heading} | ${siteName}`, description };
}

// Each h2 sits in its own band and labels its region (Phase 6 spec, D5).
function Band({ id, heading, children }: { id: string; heading: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="container-page border-t border-line py-16">
      <h2 id={id} className="font-display text-display-2 font-extrabold">
        {heading}
      </h2>
      {children}
    </section>
  );
}

export default async function About() {
  const [groups, heading, intro, story, oneTeam, pillarsCopy, sdd] = await Promise.all([
    visiblePillars(),
    block("about.heading"),
    block("about.intro"),
    Promise.all([
      block("about.story.heading"),
      block("about.story.body"),
      block("about.facts.founded"),
      block("about.founded.year"),
      block("about.facts.leadership"),
      block("about.founder.name"),
      block("about.founder.title"),
      block("about.facts.registered"),
      block("about.facts.based"),
    ]),
    Promise.all([block("about.oneTeam.heading"), block("about.oneTeam.body")]),
    Promise.all([block("about.pillars.heading"), block("about.pillars.intro")]),
    Promise.all([block("about.sdd.heading"), block("about.sdd.body"), block("about.sdd.link")]),
  ]);
  const [storyHeading, storyBody, founded, year, leadership, founder, title, registered, based] =
    story;
  // Registration and location are site data, the same values the footer shows (D6).
  const facts = [
    { label: founded, value: year },
    { label: leadership, value: founder, detail: title },
    { label: registered, value: contact.registration },
    { label: based, value: contact.location },
  ];

  // One card per visible pillar, so a fully muted pillar loses its card and role together (D4).
  const cards = await Promise.all(
    groups.map(async ({ pillar }) => ({
      pillar,
      name: await block(pillar.nameKey),
      role: await block(pillar.roleKey),
    })),
  );
  // Shown only while Build is visible, linking to its first visible service (D7).
  const build = groups.find((g) => g.pillar.id === "build");

  return (
    <>
      <section className="container-page py-16 md:py-24">
        <h1 className="max-w-4xl font-display text-display-1 font-black tracking-tight">
          {heading}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">{intro}</p>
      </section>

      <Band id="about-story" heading={storyHeading}>
        <p className="mt-4 max-w-2xl text-lg text-muted">{storyBody}</p>
        <dl className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(({ label, value, detail }) => (
            <div key={label} className="border-l-4 border-brand pl-4">
              <dt className="text-base text-muted">{label}</dt>
              <dd className="mt-1 font-display text-xl font-extrabold">{value}</dd>
              {detail && <dd className="mt-1 text-base text-muted">{detail}</dd>}
            </div>
          ))}
        </dl>
      </Band>

      <Band id="about-one-team" heading={oneTeam[0]}>
        <p className="mt-4 max-w-2xl text-lg text-muted">{oneTeam[1]}</p>
      </Band>

      <Band id="about-pillars" heading={pillarsCopy[0]}>
        <p className="mt-4 max-w-2xl text-lg text-muted">{pillarsCopy[1]}</p>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {cards.map(({ pillar, name, role }) => (
            // muted text stays on the ink surface at ≥ 16px (tech-stack.md → Design tokens).
            <li
              key={pillar.id}
              className="flex flex-col rounded-xl border border-t-4 border-line border-t-brand bg-ink p-6"
            >
              <h3 className="font-display text-2xl font-extrabold">{name}</h3>
              <p className="mt-3 text-base text-muted">{role}</p>
              <StepList pillar={pillar} className="mt-6 text-xl" />
            </li>
          ))}
        </ul>
      </Band>

      {build && (
        <Band id="about-sdd" heading={sdd[0]}>
          <p className="mt-4 max-w-2xl text-lg text-muted">{sdd[1]}</p>
          <StepList pillar={build.pillar} className="mt-6 text-xl" />
          <p className="mt-8">
            <Link
              href={`/services/${build.services[0].slug}`}
              className="font-semibold underline decoration-brand decoration-2 underline-offset-4"
            >
              {sdd[2]}
            </Link>
          </p>
        </Band>
      )}

      <div className="border-t border-line">
        <Cta />
      </div>
    </>
  );
}
