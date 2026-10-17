import { Connect4 } from "@/components/Connect4";
import { Contributions } from "@/components/Contributions";
import { CopyEmail } from "@/components/CopyEmail";
import { Footer } from "@/components/Footer";
import { NameBlock, TopBar } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { InlineLink } from "@/components/InlineLink";
import { ListItemBody, rowClass, staticRowClass } from "@/components/ListItem";
import { ProjectRow, ProjectsProvider } from "@/components/Projects";
import { delay, Section, stagger } from "@/components/Section";
import { Showcase } from "@/components/Showcase";
import { StickyAside } from "@/components/StickyAside";
import { connect, experience, featured as featuredData, profile, work as workData } from "@/data/site";
import { withGallery } from "@/lib/gallery";

export const revalidate = 3600;

const STEP = 25;

export default function Home() {
  // Screenshots dropped into public/work/<slug>/ are picked up here.
  const featured = withGallery(featuredData);
  const work = withGallery(workData);
  const everyProject = [...new Map([...featured, ...work].map((p) => [p.slug, p])).values()];

  // Running stagger so every row fades in just after the one above it.
  const next = stagger(150, STEP);

  const showcase = (
    <>
      <Showcase projects={featured} />
      <Contributions />
      <Connect4 />
    </>
  );

  return (
    <ProjectsProvider projects={everyProject}>
      <div className="group/page">
        <main className="mx-auto max-w-[900px] px-5 pb-32 pt-12 sm:px-8">
          <div className="flex flex-col desktop:mx-auto desktop:grid desktop:w-fit desktop:grid-cols-[320px_320px] desktop:gap-x-16">
            {/* Left column */}
            <div>
              <NameBlock subtitle={profile.roles} />
              <TopBar active="home" className="fade-in -mt-2 mb-8 desktop:hidden" />

              <div
                className="fade-in flex flex-col gap-3 text-sm leading-5 text-neutral-500 dark:text-neutral-400"
                style={delay(50)}
              >
                <p className="text-neutral-700 dark:text-neutral-300">
                  Solving problems and learning from the outcomes.
                </p>
                <p>
                  Currently an{" "}
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    AI Engineer &amp; Agentic Systems Builder
                  </span>{" "}
                  and Senior Manager at{" "}
                  <InlineLink href="https://www.tatamotors.com">Tata Motors</InlineLink>, building
                  intelligent solutions that solve real-world business problems. Studied at{" "}
                  <InlineLink href="https://nitc.ac.in">NIT Calicut</InlineLink>, India.
                </p>
                <p>
                  Shipping agentic systems: building harnesses, engineering context, building and
                  using MCP servers, writing evals, and validating agents in real-world scenarios
                  with guardrails and security built in.
                </p>
                <p>I read every diff my coding agents write. Always curious, always locked in.</p>
                <p>
                  Reach me at <CopyEmail email={profile.email} /> or on{" "}
                  <InlineLink href={connect[2].href}>LinkedIn</InlineLink>.
                </p>
              </div>

              <div className="fade-in mt-8 desktop:hidden" style={delay(100)}>
                {showcase}
              </div>

              <Section label="Featured" start={next()}>
                {featured.map((p) => (
                  <div key={p.slug} className="fade-in" style={delay(next())}>
                    <ProjectRow project={p} />
                  </div>
                ))}
              </Section>

              <Section label="At Tata Motors" start={next()}>
                {work.map((p) => (
                  <div key={p.slug} className="fade-in" style={delay(next())}>
                    <ProjectRow project={p} />
                  </div>
                ))}
              </Section>

              <Section label="Experience" start={next()}>
                {experience.map((e) => (
                  <div key={e.title} className="fade-in" style={delay(next())}>
                    <div className={staticRowClass}>
                      <ListItemBody
                        icon={<Icon name={e.icon} />}
                        title={e.title}
                        subtitle={e.subtitle}
                        meta={e.period}
                      />
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

              <Footer style={delay(next())} />
            </div>

            {/* Right column (desktop) */}
            <div className="hidden desktop:block">
              <StickyAside className="pt-5">
                <TopBar active="home" className="fade-in mb-8" />
                <div className="fade-in" style={delay(100)}>
                  {showcase}
                </div>
              </StickyAside>
            </div>
          </div>
        </main>
      </div>
    </ProjectsProvider>
  );
}
