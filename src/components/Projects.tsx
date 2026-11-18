"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { architectures } from "@/data/architecture";
import type { Project } from "@/data/site";
import { tellMascot } from "@/lib/mascot";
import { Blueprint, partIcon, type BlueprintHandle } from "./Blueprint";

type Opener = (slug: string, from?: DOMRect) => void;
const OpenProject = createContext<Opener>(() => {});
export const useOpenProject = () => useContext(OpenProject);

const accentOf = (p: Project) => p.accent ?? "#737373";
const isWork = (p: Project) => p.role === "Tata Motors";
const grotesk = { fontFamily: "var(--font-grotesk)" } as CSSProperties;

/** Holds every project and renders the one full-screen view. */
export function ProjectsProvider({ projects, children }: { projects: Project[]; children: ReactNode }) {
  const [state, setState] = useState<{ project: Project; from?: DOMRect; n: number } | null>(null);

  const openProject = useCallback<Opener>(
    (slug, from) => {
      const p = projects.find((x) => x.slug === slug);
      if (!p) return;
      setState((s) => ({ project: p, from, n: (s?.n ?? 0) + 1 }));
      tellMascot({ type: "project", slug });
    },
    [projects],
  );

  return (
    <OpenProject.Provider value={openProject}>
      {children}
      {state && (
        <ProjectView
          key={state.n}
          project={state.project}
          from={state.from}
          projects={projects}
          onSwitch={(p) => setState((s) => (s ? { ...s, project: p } : s))}
          onClosed={() => setState(null)}
        />
      )}
    </OpenProject.Provider>
  );
}

// ---- Bento ------------------------------------------------------------------------------------------

function tileRect(slug: string) {
  return document.querySelector(`[data-project="${slug}"]`)?.getBoundingClientRect();
}

/** A project's tile: calm on the outside, with a small window onto its live blueprint. */
function Tile({
  project,
  hero = false,
  large = false,
  className = "",
}: {
  project: Project;
  hero?: boolean;
  /** A two-row tile without the hero's oversized title, for when a filter leaves two side by side. */
  large?: boolean;
  className?: string;
}) {
  const open = useOpenProject();
  const arch = architectures[project.slug];
  const stats = arch?.stats ?? [];
  const accent = accentOf(project);

  return (
    <div
      data-project={project.slug}
      className={`group relative flex overflow-hidden rounded-[22px] bg-[var(--stage)] p-2 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 has-[button:active]:scale-[0.995] ${
        hero || large ? "min-h-[300px] flex-col-reverse gap-2 sm:flex-row" : "min-h-[220px] gap-2"
      } ${className}`}
      style={grotesk}
    >
      <div className={`flex flex-1 flex-col justify-between ${hero || large ? "p-5 sm:p-6" : "p-4"}`} aria-hidden>
        <span className="flex items-center gap-2 text-[12px] text-[var(--ink-2)]">
          <span className="size-1.5 rounded-full" style={{ background: accent }} />
          {project.role ?? "Personal"} · {project.year}
        </span>
        <span className="block">
          <span
            className={`block font-medium tracking-[-0.03em] text-[var(--ink)] ${
              hero ? "text-[clamp(36px,4vw,56px)] leading-[0.95]" : large ? "text-[34px] leading-[1.05]" : "text-[22px] leading-6"
            }`}
          >
            {project.title}
          </span>
          <span className={`mt-1.5 block text-[var(--ink-2)] ${hero || large ? "text-[16px]" : "text-[14px] leading-5"}`}>{project.tagline}</span>
          {hero || large ? (
            <span className="mt-7 flex flex-wrap gap-x-7 gap-y-3">
              {stats.slice(0, hero ? 3 : 2).map((s) => (
                <span key={s.label} className="block">
                  <span className="block text-[24px] font-medium leading-none tracking-[-0.03em] tabular-nums text-[var(--ink)]">{s.value}</span>
                  <span className="mt-1 block text-[12px] text-[var(--ink-2)]">{s.label}</span>
                </span>
              ))}
            </span>
          ) : (
            stats[0] && (
              <span className="mt-4 block text-[12px] text-[var(--ink-2)]">
                <span className="font-medium text-[var(--ink)]">{stats[0].value}</span> {stats[0].label}
              </span>
            )
          )}
        </span>
      </div>
      {arch && (
        <Blueprint
          mini
          arch={arch}
          accent={accent}
          video={hero ? project.video : undefined}
          className={`shrink-0 rounded-[16px] ${hero ? "h-[220px] sm:h-auto sm:w-[56%]" : large ? "h-[220px] sm:h-auto sm:w-[52%]" : "w-[44%]"}`}
        />
      )}
      <span className="pointer-events-none absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-white/90 text-black opacity-0 shadow-sm transition-all duration-300 group-hover:opacity-100 group-hover:rotate-45 group-has-[button:focus-visible]:opacity-100">
        <ArrowUpRight size={14} weight="bold" />
      </span>
      {/* The whole tile is one button, laid over the top so the blueprint can stay plain markup. */}
      <button
        type="button"
        data-nudge
        data-ground="card"
        onClick={() => open(project.slug, tileRect(project.slug))}
        aria-haspopup="dialog"
        aria-label={`${project.title}, ${project.tagline}`}
        className="absolute inset-0 cursor-pointer rounded-[22px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-2)]"
      />
    </div>
  );
}

type Filter = "all" | "work" | "personal";
const FILTERS: { value: Filter; label: string; keep: (p: Project) => boolean }[] = [
  { value: "all", label: "All", keep: () => true },
  { value: "work", label: "Tata Motors", keep: isWork },
  { value: "personal", label: "Personal", keep: (p) => !isWork(p) },
];

/**
 * The Work section: the title with a filter beside it, over a compact grid. Showing everything, AIVA takes the
 * top-left two-by-two; filtered down, each project gets the large tile so the grid keeps its height.
 */
export function WorkSection({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = projects.filter(FILTERS.find((f) => f.value === filter)!.keep);
  const all = filter === "all";

  return (
    <>
      <div className="fade-in flex flex-wrap items-end gap-x-8 gap-y-4" style={{ animationDelay: "150ms" }}>
        <h2
          id="work"
          data-ground="Featured"
          className="flex items-start font-[family-name:var(--font-grotesk)] text-[44px] font-medium leading-none tracking-[-0.035em] text-foreground"
        >
          Work
          <sup className="ml-1 mt-1 text-[12px] font-normal tracking-normal text-neutral-400">{shown.length}</sup>
        </h2>
        <div role="tablist" aria-label="Filter projects" className="-ml-1 flex gap-1 font-[family-name:var(--font-grotesk)]">
          {FILTERS.map((f) => {
            const on = f.value === filter;
            const count = projects.filter(f.keep).length;
            return (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setFilter(f.value)}
                className={`flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[15px] tracking-[-0.01em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ink-2)] ${
                  on ? "bg-[var(--stage)] text-[var(--ink)]" : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                }`}
              >
                {f.label}
                <span className="text-[12px] tabular-nums text-neutral-400">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div
        key={filter}
        className={`mt-6 grid gap-3 lg:auto-rows-[228px] ${all ? "md:grid-cols-2 lg:grid-cols-3" : shown.length > 1 ? "lg:grid-cols-2" : ""}`}
      >
        {shown.map((p, i) => {
          const hero = p.slug === "aiva";
          const large = !all && !hero;
          return (
            <div
              key={p.slug}
              className={`fade-in flex ${hero || large ? "lg:row-span-2" : ""} ${all && hero ? "md:col-span-2" : ""}`}
              style={{ animationDelay: `${(all ? 200 : 0) + i * 60}ms` }}
            >
              <Tile project={p} hero={hero} large={large} className="w-full" />
            </div>
          );
        })}
      </div>
    </>
  );
}

// ---- Full-screen view -------------------------------------------------------------------------------

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function inset(r: DOMRect | undefined) {
  if (!r) return "inset(0px 0px 0px 0px round 0px)";
  return `inset(${r.top}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px round 26px)`;
}

function ProjectView({
  project,
  from,
  projects,
  onSwitch,
  onClosed,
}: {
  project: Project;
  from?: DOMRect;
  projects: Project[];
  onSwitch: (p: Project) => void;
  onClosed: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pane = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  const arch = architectures[project.slug];

  // Open out of the tile: start clipped to its box, then let go to the full screen.
  useLayoutEffect(() => {
    const d = dialog.current;
    const el = pane.current;
    if (!d || !el) return;
    d.showModal();
    document.documentElement.style.overflow = "hidden";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !from) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
    else el.animate([{ clipPath: inset(from) }, { clipPath: inset(undefined) }], { duration: 560, easing: EASE });
  }, [from]);

  useEffect(
    () => () => {
      document.documentElement.style.overflow = "";
    },
    [],
  );

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const el = pane.current;
    const finish = () => {
      dialog.current?.close();
      document.documentElement.style.overflow = "";
      onClosed();
    };
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();
    const to = tileRect(project.slug);
    const onScreen = to && to.bottom > 0 && to.top < window.innerHeight;
    const anim = onScreen
      ? el.animate([{ clipPath: inset(undefined) }, { clipPath: inset(to) }], { duration: 440, easing: EASE, fill: "forwards" })
      : el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: "ease-in", fill: "forwards" });
    anim.onfinish = finish;
  }, [onClosed, project.slug]);

  function switchTo(p: Project) {
    pane.current?.scrollTo({ top: 0 });
    onSwitch(p);
  }

  const at = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(at + 1) % projects.length];
  const prev = projects[(at - 1 + projects.length) % projects.length];
  const context = isWork(project) ? `Built at ${project.role}, ${project.year}.` : `${project.role ?? "Personal project"}, ${project.year}.`;
  const stack = project.stack.length > 1 ? `${project.stack.slice(0, -1).join(", ")} and ${project.stack.at(-1)}` : project.stack[0];
  const iconBtn =
    "flex size-9 cursor-pointer items-center justify-center rounded-full text-[var(--ink)] outline-none transition-colors hover:bg-[var(--surface)] focus-visible:ring-2 focus-visible:ring-[var(--ink-2)] active:scale-95";

  return (
    <dialog
      ref={dialog}
      className="overlay"
      aria-labelledby="project-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div ref={pane} className="overlay-pane" style={grotesk}>
        <div className="sticky top-0 z-10 bg-[var(--background)]">
          <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between px-5 sm:px-8">
            <button
              type="button"
              onClick={close}
              className="-ml-3 flex h-9 cursor-pointer items-center gap-2 rounded-full px-3 text-[14px] text-[var(--ink)] outline-none transition-colors hover:bg-[var(--surface)] focus-visible:ring-2 focus-visible:ring-[var(--ink-2)]"
            >
              <ArrowLeft size={15} /> Work
            </button>
            <div className="flex items-center gap-1">
              <span className="mr-2 text-[13px] tabular-nums text-[var(--ink-2)]">
                {at + 1} of {projects.length}
              </span>
              <button type="button" onClick={() => switchTo(prev)} aria-label={`Previous project: ${prev.title}`} className={iconBtn}>
                <ArrowLeft size={15} />
              </button>
              <button type="button" onClick={() => switchTo(next)} aria-label={`Next project: ${next.title}`} className={`${iconBtn} -mr-2`}>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>

        <article key={project.slug} className="mx-auto max-w-[1240px] px-5 pb-16 sm:px-8">
          <header className="fade-in flex flex-col gap-5 pt-3 lg:flex-row lg:items-end lg:justify-between lg:gap-12" style={{ animationDelay: "100ms" }}>
            <div className="min-w-0">
              <h2 id="project-title" className="text-[clamp(40px,4.6vw,60px)] font-medium leading-[0.95] tracking-[-0.045em] text-[var(--ink)]">
                {project.title}
              </h2>
              <p className="mt-2.5 text-[18px] leading-snug tracking-[-0.015em] text-[var(--ink)]">{project.tagline}</p>
              <p className="mt-1 max-w-[62ch] font-[family-name:var(--font-inter)] text-[13px] leading-[1.55] text-[var(--ink-2)]">
                {context} Made with {stack}.
              </p>
            </div>
            {arch && (
              <dl className="grid shrink-0 grid-cols-3 gap-x-6 gap-y-4 sm:flex sm:gap-x-8">
                {arch.stats.map((s) => (
                  <div key={s.label} className="flex flex-col-reverse">
                    <dt className="mt-1 max-w-[14ch] font-[family-name:var(--font-inter)] text-[12px] leading-4 text-[var(--ink-2)]">{s.label}</dt>
                    <dd className="text-[26px] font-medium leading-none tracking-[-0.035em] tabular-nums text-[var(--ink)]">{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </header>

          {arch && <Showcase key={project.slug} project={project} />}

          {project.links?.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {project.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--ink)] px-5 text-[14px] font-medium text-[var(--background)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {l.label}
                  <ArrowUpRight size={14} />
                </a>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => switchTo(next)}
            className="group mt-14 flex w-full cursor-pointer items-center justify-between gap-6 rounded-[24px] bg-[var(--stage)] px-6 py-6 text-left outline-none transition-colors hover:bg-[var(--surface)] focus-visible:ring-2 focus-visible:ring-[var(--ink-2)] sm:px-8 sm:py-7"
          >
            <span>
              <span className="block font-[family-name:var(--font-inter)] text-[14px] text-[var(--ink-2)]">Next project</span>
              <span className="mt-1 block text-[clamp(26px,3vw,38px)] font-medium leading-none tracking-[-0.04em] text-[var(--ink)]">{next.title}</span>
              <span className="mt-2 block font-[family-name:var(--font-inter)] text-[14px] text-[var(--ink-2)]">{next.tagline}</span>
            </span>
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[var(--background)] transition-transform duration-300 group-hover:translate-x-1">
              <ArrowRight size={18} />
            </span>
          </button>
        </article>
      </div>
    </dialog>
  );
}

type Arch = (typeof architectures)[string];

/**
 * "Built on": the ideas behind the build, one at a time. Each is a short path through the stack with a plain
 * caption under every step. Picking an idea runs a light along its path once; pointing at the path lights the
 * same parts in the blueprint, and tapping a step lifts its layer out.
 */
function IdeaPath({
  arch,
  accent,
  onLight,
  onOpen,
}: {
  arch: Arch;
  accent: string;
  onLight: (parts: string[] | null) => void;
  onOpen: (layer: number, part: number) => void;
}) {
  const principles = arch.principles ?? [];
  const [active, setActive] = useState(0);
  // How far the light has run along the path; -1 before it starts.
  const [reach, setReach] = useState(-1);
  const [focus, setFocus] = useState<number | null>(null);
  const [inside, setInside] = useState(false);
  const box = useRef<HTMLElement>(null);
  const idea = principles[active];
  const steps = idea.steps;
  const n = steps.length;
  const parts = [...new Set(steps.map((s) => s.part))];

  // Run the light once when the section first comes into view, and again whenever another idea is picked.
  const run = useCallback(
    (count: number) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setReach(count - 1);
      setReach(0);
      let i = 0;
      const id = window.setInterval(() => {
        i += 1;
        setReach(i);
        if (i >= count - 1) window.clearInterval(id);
      }, 420);
      return () => window.clearInterval(id);
    },
    [],
  );

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let stop: (() => void) | void;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      stop = run(n);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => {
      io.disconnect();
      stop?.();
    };
    // Only the first view starts it; picking an idea runs it from the click.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopRun = useRef<(() => void) | void>(undefined);
  useEffect(() => () => stopRun.current?.(), []);

  const pick = (i: number) => {
    if (i === active) return;
    stopRun.current?.();
    setActive(i);
    setFocus(null);
    stopRun.current = run(principles[i].steps.length);
  };

  // While the pointer is over the path, the blueprint lights the parts of whichever idea is showing.
  const partsKey = parts.join(",");
  useEffect(() => {
    onLight(inside ? partsKey.split(",") : null);
  }, [inside, partsKey, onLight]);

  const part = (key: string) => {
    const [l, p] = key.split(":").map(Number);
    return { l, p, kind: arch.layers[l].parts[p].kind, layer: arch.layers[l].name };
  };
  const centre = (i: number) => `${((i + 0.5) / n) * 100}%`;
  const lead = focus ?? Math.max(reach, 0);

  return (
    <section
      ref={box}
      aria-labelledby="ideas-title"
      style={{ "--accent": accent } as CSSProperties}
      onMouseEnter={() => setInside(true)}
      onMouseLeave={() => {
        setInside(false);
        setFocus(null);
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <h3 id="ideas-title" className="sr-only">
          Built on
        </h3>
        <div role="tablist" aria-label="Ideas behind the build" className="path-seg inline-flex gap-0.5 rounded-full p-[3px]">
          {principles.map((pr, i) => {
            const on = i === active;
            const I = partIcon[part(pr.steps[0].part).kind];
            return (
              <button
                key={pr.tab}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => pick(i)}
                className="path-tab flex h-[30px] cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-medium tracking-[-0.01em] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-2)]"
                data-on={on || undefined}
              >
                {on && <I size={13} weight="fill" className="text-[var(--accent)]" aria-hidden />}
                {pr.tab}
              </button>
            );
          })}
        </div>
        <p className="hidden font-[family-name:var(--font-inter)] text-[12px] text-[var(--ink-2)] sm:block">Tap a step to open its layer</p>
      </div>

      <div className="path mt-2 rounded-[18px] px-4 pb-4 pt-3.5 sm:px-5" role="tabpanel" aria-label={idea.tab}>
        <p key={`h${active}`} className="path-in text-[19px] font-medium leading-6 tracking-[-0.02em] text-[var(--ink)]">
          {idea.text}
        </p>
        <p key={`p${active}`} className="path-in mt-1 font-[family-name:var(--font-inter)] text-[13px] leading-5 text-[var(--ink-2)]">
          {idea.proof}
        </p>

        <ol key={`t${active}`} className="relative mt-4 grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          <span aria-hidden className="path-rail absolute top-[19px] h-[2px]" style={{ left: centre(0), right: centre(0) }} />
          <span
            aria-hidden
            className="path-fill absolute top-[19px] h-[2px]"
            style={{ left: centre(0), width: `calc(${centre(lead)} - ${centre(0)})` }}
          />
          <span aria-hidden className="path-dot absolute top-[15px] size-2.5 -translate-x-1/2 rounded-full" style={{ left: centre(lead) }} />
          {steps.map((st, i) => {
            const pt = part(st.part);
            const I = partIcon[pt.kind];
            const state = i === lead ? "now" : i < lead || (focus === null && reach >= n - 1) ? "done" : "next";
            return (
              <li key={i} className="relative z-[1] flex justify-center">
                <button
                  type="button"
                  onClick={() => onOpen(pt.l, pt.p)}
                  onMouseEnter={() => setFocus(i)}
                  onFocus={() => setFocus(i)}
                  onBlur={() => setFocus(null)}
                  data-state={state}
                  className="path-node group flex min-w-0 cursor-pointer flex-col items-center px-1 text-center outline-none"
                  aria-label={`${st.name}: ${st.caption}. Open the ${pt.layer} layer.`}
                >
                  <span className="path-icon flex size-10 items-center justify-center rounded-[13px] group-focus-visible:ring-2 group-focus-visible:ring-[var(--ink-2)]">
                    <I size={19} weight="fill" />
                  </span>
                  <span className="path-name mt-2 text-[13px] font-medium leading-4 tracking-[-0.01em]">{st.name}</span>
                  <span className="mt-0.5 max-w-[118px] font-[family-name:var(--font-inter)] text-[11.5px] leading-[1.35] text-[var(--ink-2)]">
                    {st.caption}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/**
 * Everything about how the project works on one screen: the demo and the blueprint side by side at the same
 * height, and under them the ideas it is built on. Hovering an idea lights the parts it runs through; tapping a
 * part in its chain lifts that layer out of the blueprint.
 */
function Showcase({ project }: { project: Project }) {
  const arch = architectures[project.slug];
  const accent = accentOf(project);
  const [ratio, setRatio] = useState(16 / 9);
  const [lit, setLit] = useState<string[] | null>(null);
  const blueprint = useRef<BlueprintHandle>(null);
  const principles = arch.principles ?? [];
  const video = project.video;

  const ideas = principles.length > 0 && (
    <IdeaPath
      arch={arch}
      accent={accent}
      onLight={setLit}
      onOpen={(l, p) => blueprint.current?.openLayer(l, p)}
    />
  );

  const stage = (
    <section data-ground="sheet" className="flex min-h-0 flex-col" aria-labelledby="arch-title">
      <div className="mb-2.5 flex items-baseline justify-between gap-4">
        <h3 id="arch-title" className="text-[15px] font-medium tracking-[-0.015em] text-[var(--ink)]">
          How it&apos;s built
        </h3>
        <p className="font-[family-name:var(--font-inter)] text-[12px] text-[var(--ink-2)]">Drag to turn, pinch to zoom</p>
      </div>
      <div className="flex-1 overflow-hidden rounded-[20px]">
        <Blueprint
          ref={blueprint}
          arch={arch}
          accent={accent}
          video={video}
          title={project.title}
          highlight={lit}
          stageClass={video ? "h-[420px] lg:h-full" : "h-[420px] lg:h-[520px]"}
        />
      </div>
    </section>
  );

  if (!video)
    return (
      <div className="fade-in mt-7 grid gap-8 lg:grid-cols-12 lg:gap-6" style={{ animationDelay: "180ms" }}>
        <div className="lg:col-span-7">{stage}</div>
        <div className="lg:col-span-5">{ideas}</div>
      </div>
    );

  return (
    <div className="fade-in mt-7 grid gap-8 lg:grid-cols-2 lg:gap-4" style={{ animationDelay: "180ms" }}>
      <div className="flex flex-col gap-8 lg:gap-6">
        <section aria-labelledby="demo-title">
          <h3 id="demo-title" className="mb-2.5 text-[15px] font-medium tracking-[-0.015em] text-[var(--ink)]">
            What it does
          </h3>
          <video
            src={video}
            className="w-full rounded-[20px] bg-[var(--stage)]"
            style={{ aspectRatio: ratio }}
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (v.videoWidth && v.videoHeight) setRatio(v.videoWidth / v.videoHeight);
            }}
            controls
            autoPlay
            muted
            loop
            playsInline
          />
        </section>
        <div className="hidden lg:block">{ideas}</div>
      </div>
      {stage}
      <div className="lg:hidden">{ideas}</div>
    </div>
  );
}
