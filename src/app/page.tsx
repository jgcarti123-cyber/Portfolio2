import Image from "next/image";
import { BusinessCard } from "@/components/BusinessCard";
import { Connect4 } from "@/components/Connect4";
import { Contributions } from "@/components/Contributions";
import { CopyEmail } from "@/components/CopyEmail";
import { Footer } from "@/components/Footer";
import { InlineLink } from "@/components/InlineLink";
import { RotatingText } from "@/components/RotatingText";
import { ProjectsProvider, WorkSection } from "@/components/Projects";
import { delay, stagger } from "@/components/Section";
import { connect, featured as featuredData, profile, work as workData } from "@/data/site";
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
        <main>
          {/* On wide screens the intro becomes a column on the left and the Work bento fills the rest from the top. */}
          <div className="xl:mx-auto xl:mt-11 xl:grid xl:max-w-[1440px] xl:grid-cols-[330px_1fr] xl:items-start xl:gap-x-14 xl:px-8">
          {/* Intro: the words, then the graph and Connect 4 (beside them on tablets, under them in the column) */}
          <div className="mx-auto mt-10 flex max-w-[900px] flex-col gap-10 px-5 sm:px-8 desktop:grid desktop:grid-cols-[380px_320px] desktop:justify-center desktop:gap-x-16 xl:sticky xl:top-7 xl:m-0 xl:flex xl:max-w-none xl:gap-8 xl:p-0">
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

          {/* Projects: a bento, full width under the intro on smaller screens */}
          <section className="mx-auto mt-12 max-w-[1440px] px-5 sm:px-8 xl:m-0 xl:max-w-none xl:p-0" aria-labelledby="work">
            <WorkSection projects={projects} />
          </section>
          </div>

          {/* The page closes on a photo: the temple on the left, the business card in the open sky between it and
              the sun, and the footer along the bottom. The band keeps the photo's framing as the window widens; on
              smaller screens the card sits centred instead. */}
          <section
            data-photo
            aria-label="Contact"
            className="relative isolate mt-24 flex min-h-[560px] flex-col overflow-hidden lg:h-[clamp(560px,43vw,820px)]"
          >
            <Image
              src="/closing-ascii.jpg"
              alt=""
              fill
              quality={85}
              sizes="100vw"
              className="-z-10 object-cover object-[58%_55%] lg:object-[50%_55%]"
            />
            <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(40_0_8/0.18),rgb(40_0_8/0.3))]" />
            <div className="fade-in mx-auto mt-16 w-full max-w-[460px] px-5 sm:mt-24 lg:absolute lg:left-[62%] lg:top-[40%] lg:m-0 lg:max-w-[440px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:px-0 xl:left-[66%]" style={delay(next())}>
              <BusinessCard />
            </div>
            <div className="mx-auto mt-auto w-full max-w-[1440px] px-5 pb-6 pt-16 sm:px-8">
              <Footer onPhoto style={delay(next())} />
            </div>
          </section>
        </main>
      </div>
    </ProjectsProvider>
  );
}
