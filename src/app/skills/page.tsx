import type { Metadata } from "next";
import { FileText } from "@phosphor-icons/react/dist/ssr";
import { NameBlock, TopBar } from "@/components/Header";
import { delay, SectionLabel, stagger } from "@/components/Section";
import { skillGroups, type Skill } from "@/data/skills";

export const metadata: Metadata = {
  title: "Skills",
  description: "Agent skills I use for AI engineering and full-stack work.",
};

function SkillRow({ skill, style }: { skill: Skill; style: React.CSSProperties }) {
  const external = skill.href.startsWith("http");
  return (
    <a
      href={skill.href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="fade-in group -mx-3 flex gap-3 rounded-lg px-3 py-2 outline-none transition-all duration-150 hover:bg-neutral-100 focus-visible:bg-neutral-100 active:scale-[0.98] dark:hover:bg-neutral-900 dark:focus-visible:bg-neutral-900"
      style={style}
    >
      <FileText
        size={16}
        weight="bold"
        className="mt-0.5 shrink-0 text-neutral-400 transition-colors group-hover:text-neutral-700 dark:text-neutral-600 dark:group-hover:text-neutral-300"
      />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium leading-5 text-foreground">
          {skill.name.startsWith("/") || skill.name.includes(".") ? skill.name : `/${skill.name}`}
        </span>
        <span className="block text-sm leading-5 text-neutral-500 dark:text-neutral-400">
          {skill.description}
        </span>
      </span>
    </a>
  );
}

export default function SkillsPage() {
  const next = stagger(100);

  const forAgents: Skill = {
    name: "llms.txt is set up",
    description: "Structured context at /llms.txt",
    href: "/llms.txt",
  };

  const column = (side: "left" | "right") =>
    skillGroups
      .filter((g) => g.column === side)
      .map((g) => (
        <section key={g.label} className="mb-10">
          <SectionLabel style={delay(next())}>{g.label}</SectionLabel>
          <div className="mt-4 flex flex-col gap-1">
            {g.skills.map((s) => (
              <SkillRow key={s.name} skill={s} style={delay(next())} />
            ))}
          </div>
        </section>
      ));

  return (
    <div className="group/page">
      <main className="mx-auto max-w-[900px] px-5 pb-32 pt-12 sm:px-8">
        <div className="flex flex-col desktop:mx-auto desktop:grid desktop:w-fit desktop:grid-cols-[320px_320px] desktop:gap-x-16">
          <div>
            <NameBlock subtitle="Curated Skills" />
            <TopBar active="skills" className="fade-in -mt-2 mb-8 desktop:hidden" />
            <p
              className="fade-in mb-10 text-sm leading-5 text-neutral-500 dark:text-neutral-400"
              style={delay(50)}
            >
              Skills are small instruction packs that teach coding agents how to do one thing well.
              These are the ones I reach for when building AI systems and full-stack apps.
            </p>
            {column("left")}
            <section className="mb-10">
              <SectionLabel style={delay(next())}>For Agents</SectionLabel>
              <div className="mt-4">
                <SkillRow skill={forAgents} style={delay(next())} />
              </div>
            </section>
          </div>

          <div>
            <TopBar active="skills" className="fade-in mb-8 hidden pt-5 desktop:flex" />
            {column("right")}
          </div>
        </div>
      </main>
    </div>
  );
}
