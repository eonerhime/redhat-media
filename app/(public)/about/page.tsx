import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Cta } from "@/components/shared/cta";
import { StepList } from "@/components/shared/step-list";
import { block, type BlockKey } from "@/lib/content/block";
import { visiblePillars } from "@/lib/content/services";
import { pageMetadata } from "@/lib/seo/metadata";
import { contact, siteName } from "@/lib/site";
import { BodyText, Editable } from "@/components/cms/editable";
import { EditButton } from "@/components/cms/edit-button";

// Title is the heading plus the site name (Phase 6 spec, D8; kept by Phase 14 spec, D1).
export async function generateMetadata(): Promise<Metadata> {
  const [heading, description] = await Promise.all([
    block("about.heading"),
    block("about.meta.description"),
  ]);
  return pageMetadata({ title: `${heading} | ${siteName}`, description, path: "/about" });
}

// Each h2 sits in its own band and labels its region (Phase 6 spec, D5).
function Band({
  id,
  headingKey,
  heading,
  children,
}: {
  id: string;
  headingKey: BlockKey;
  heading: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="container-page border-t border-line py-16">
      <h2 id={id} className="font-display text-display-2 font-extrabold">
        <Editable blockKey={headingKey} value={heading} />
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
  const facts: {
    label: [BlockKey, string];
    value: [BlockKey, string] | string;
    detail?: [BlockKey, string];
  }[] = [
    { label: ["about.facts.founded", founded], value: ["about.founded.year", year] },
    {
      label: ["about.facts.leadership", leadership],
      value: ["about.founder.name", founder],
      detail: ["about.founder.title", title],
    },
    { label: ["about.facts.registered", registered], value: contact.registration },
    { label: ["about.facts.based", based], value: contact.location },
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
          <Editable blockKey="about.heading" value={heading} />
        </h1>
        <BodyText
          blockKey="about.intro"
          value={intro}
          className="mt-6 max-w-2xl text-lg text-muted"
        />
      </section>

      <Band id="about-story" headingKey="about.story.heading" heading={storyHeading}>
        <BodyText
          blockKey="about.story.body"
          value={storyBody}
          className="mt-4 max-w-2xl text-lg text-muted"
        />
        <dl className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(({ label, value, detail }) => (
            <div key={label[0]} className="border-l-4 border-brand pl-4">
              <dt className="text-base text-muted">
                <Editable blockKey={label[0]} value={label[1]} />
              </dt>
              <dd className="mt-1 font-display text-xl font-extrabold">
                {typeof value === "string" ? (
                  value
                ) : (
                  <Editable blockKey={value[0]} value={value[1]} />
                )}
              </dd>
              {detail && (
                <dd className="mt-1 text-base text-muted">
                  <Editable blockKey={detail[0]} value={detail[1]} />
                </dd>
              )}
            </div>
          ))}
        </dl>
      </Band>

      <Band id="about-one-team" headingKey="about.oneTeam.heading" heading={oneTeam[0]}>
        <BodyText
          blockKey="about.oneTeam.body"
          value={oneTeam[1]}
          className="mt-4 max-w-2xl text-lg text-muted"
        />
      </Band>

      <Band id="about-pillars" headingKey="about.pillars.heading" heading={pillarsCopy[0]}>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          <Editable blockKey="about.pillars.intro" value={pillarsCopy[1]} />
        </p>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {cards.map(({ pillar, name, role }) => (
            // muted text stays on the ink surface at ≥ 16px (tech-stack.md → Design tokens).
            <li
              key={pillar.id}
              className="flex flex-col rounded-xl border border-t-4 border-line border-t-brand bg-ink p-6"
            >
              <h3 className="font-display text-2xl font-extrabold">
                <Editable blockKey={pillar.nameKey} value={name} />
              </h3>
              <p className="mt-3 text-base text-muted">
                <Editable blockKey={pillar.roleKey} value={role} />
              </p>
              <StepList pillar={pillar} className="mt-6 text-xl" />
            </li>
          ))}
        </ul>
      </Band>

      {build && (
        <Band id="about-sdd" headingKey="about.sdd.heading" heading={sdd[0]}>
          <BodyText
            blockKey="about.sdd.body"
            value={sdd[1]}
            className="mt-4 max-w-2xl text-lg text-muted"
          />
          <StepList pillar={build.pillar} className="mt-6 text-xl" />
          <p className="mt-8">
            <Link
              href={`/services/${build.services[0].slug}`}
              className="font-semibold underline decoration-brand decoration-2 underline-offset-4"
            >
              {sdd[2]}
            </Link>
            <EditButton blockKey="about.sdd.link" value={sdd[2]} />
          </p>
        </Band>
      )}

      <div className="border-t border-line">
        <Cta />
      </div>
    </>
  );
}
