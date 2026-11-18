import { Connect4 } from "@/components/Connect4";
import { Contributions } from "@/components/Contributions";
import { CopyEmail } from "@/components/CopyEmail";
import { Footer } from "@/components/Footer";
import { GiantHeader } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { InlineLink } from "@/components/InlineLink";
import { RotatingText } from "@/components/RotatingText";
import { ListItemBody, rowClass, staticRowClass } from "@/components/ListItem";
import { ProjectsProvider, WorkSection } from "@/components/Projects";
import { delay, Section, stagger } from "@/components/Section";
import { connect, experience, featured as featuredData, profile, work as workData } from "@/data/site";
import { withGallery } from "@/lib/gallery";

export const revalidate = 3600;

const STEP = 25;
/** Bento order: AIVA leads, then sizes alternate so the grid fills (see SPOTS in Projects.tsx). */
const ORDER = ["aiva", "prim-pets", "swiggy-agent"];
/** What "Lately:" cycles through under the headline. */
const LATELY = [
  "Harness engineering",
  "Context engineering",
  "Agent memory",
  "RAG pipelines",
  "Vector embeddings",
  "Evaluations",
  "MCP servers",
  "Guardrails",
  "Full-stack products",
];
const rank = (slug: string) => (ORDER.includes(slug) ? ORDER.indexOf(slug) : ORDER.length);

export default function Home() {
  // Screenshots and demo videos dropped into public/work/<slug>/ are picked up here.
  const all = [...withGallery(featuredData), ...withGallery(workData)];
  const projects = [...new Map(all.map((p) => [p.slug, p])).values()].sort((a, b) => rank(a.slug) - rank(b.slug));

  // Running stagger so every row fades in just after the one above it.
  const next = stagger(150, STEP);

  return (
    <ProjectsProvider projects={projects}>
      <div className="group/page">
        <GiantHeader active="home" />

        <main className="pb-32">
          {/* Intro, as before: the words on the left, the graph and Connect 4 on the right */}
          <div className="mx-auto mt-10 flex max-w-[900px] flex-col gap-10 px-5 sm:px-8 desktop:grid desktop:grid-cols-[380px_320px] desktop:justify-center desktop:gap-x-16">
            <div className="fade-in" style={delay(50)}>
              <p className="font-[family-name:var(--font-grotesk)] text-[26px] font-medium leading-[1.12] tracking-[-0.03em] text-foreground sm:text-[27px]">
                Agents with judgment.
                <br />
                Interfaces with taste.
              </p>
              <p className="mt-1 flex gap-2 font-[family-name:var(--font-grotesk)] text-[26px] font-medium leading-[1.12] tracking-[-0.03em] text-neutral-300 sm:text-[27px] dark:text-neutral-700">
                Lately:
                <span className="min-w-0 flex-1 text-foreground">
                  <RotatingText items={LATELY} className="h-[1.12em]" />
                </span>
              </p>
              <p className="mt-5 text-sm leading-[1.6] text-neutral-500 dark:text-neutral-400">
                I build agents that hold up in production, and products people enjoy using. AI Engineer and Senior Manager at{" "}
                <InlineLink href="https://www.tatamotors.com">Tata Motors</InlineLink>.
              </p>
              <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-neutral-500 dark:text-neutral-400">
                <CopyEmail email={profile.email} />
                <InlineLink href={connect[2].href}>LinkedIn</InlineLink>
                <InlineLink href="https://nitc.ac.in">NIT Calicut</InlineLink>
              </p>
            </div>
            <div className="fade-in [&>section]:mt-6" style={delay(100)}>
              <Contributions />
              <Connect4 />
            </div>
          </div>

          {/* Projects: a full-width bento */}
          <section className="mx-auto mt-12 max-w-[1440px] px-5 sm:px-8" aria-labelledby="work">
            <WorkSection projects={projects} />
          </section>

          {/* Experience and Connect, as before */}
          <div className="mx-auto mt-10 flex max-w-[900px] flex-col px-5 sm:px-8 desktop:grid desktop:grid-cols-[320px_320px] desktop:justify-center desktop:gap-x-16">
            <Section label="Experience" start={next()}>
              {experience.map((e) => (
                <div key={e.title} className="fade-in" style={delay(next())}>
                  <div className={staticRowClass}>
                    <ListItemBody icon={<Icon name={e.icon} />} title={e.title} subtitle={e.subtitle} meta={e.period} />
                  </div>
                </div>
              ))}
            </Section>

            <Section label="Connect" start={next()}>
              {connect.map((c) => (
                <div key={c.subtitle} className="fade-in" style={delay(next())}>
                  <a
                    href={c.href}
                    className={rowClass}
                    {...(c.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                  >
                    <ListItemBody icon={<Icon name={c.icon} />} title={c.title} subtitle={c.subtitle} />
                  </a>
                </div>
              ))}
            </Section>
          </div>

          <div className="mx-auto max-w-[704px] px-5 sm:px-0">
            <Footer style={delay(next())} />
          </div>
        </main>
      </div>
    </ProjectsProvider>
  );
}
