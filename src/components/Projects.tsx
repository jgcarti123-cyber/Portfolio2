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
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight, Play } from "@phosphor-icons/react/dist/ssr";
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

// ---- Work ---------------------------------------------------------------------------------------------

function tileRect(slug: string) {
  return document.querySelector(`[data-project="${slug}"]`)?.getBoundingClientRect();
}

/** Where a project comes from and when, with its colour dot. */
function Meta({ project, className = "" }: { project: Project; className?: string }) {
  return (
    <span className={`flex items-center gap-2 text-[12px] text-[var(--ink-2)] ${className}`}>
      <span className="size-1.5 rounded-full" style={{ background: accentOf(project) }} />
      {project.role ?? "Personal"} · {project.year}
    </span>
  );
}

/** The whole of a project's block opens its full view; laid over the top so the rest can stay plain markup. */
function OpenButton({ project, rounded }: { project: Project; rounded: string }) {
  const open = useOpenProject();
  return (
    <button
      type="button"
      data-nudge
      data-ground="card"
      onClick={() => open(project.slug, tileRect(project.slug))}
      aria-haspopup="dialog"
      aria-label={`${project.title}, ${project.tagline}`}
      className={`absolute inset-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-2)] ${rounded}`}
    />
  );
}

/** Whether an element is at least a quarter on screen, so moving pictures can rest when nobody can see them. */
function useOnScreen<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const seen = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: 0.25 });
    seen.observe(el);
    return () => seen.disconnect();
  }, []);
  return [ref, on] as const;
}

/**
 * A project's short loop: plays while it is on screen and holds still otherwise, or for anyone who asked for less
 * motion (they see its first frame).
 */
function Loop({ teaser }: { teaser: NonNullable<Project["teaser"]> }) {
  const [ref, on] = useOnScreen<HTMLVideoElement>();
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (on && !matchMedia("(prefers-reduced-motion: reduce)").matches) v.play().catch(() => {});
    else v.pause();
  }, [on, ref]);
  return (
    <video
      ref={ref}
      src={teaser.video}
      poster={teaser.poster}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
      className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]"
    />
  );
}

/** A live site's whole page, panned slowly from the top to the bottom and back. */
function ScrollShot({ src }: { src: string }) {
  const [ref, on] = useOnScreen<HTMLDivElement>();
  return (
    <div ref={ref} data-paused={on ? undefined : ""} className="work-pan absolute inset-0" aria-hidden>
      <Image src={src} alt="" fill sizes="(min-width: 1024px) 420px, 100vw" className="object-cover" />
    </div>
  );
}

/**
 * Swiggy has no screenshots yet, so its demo is drawn: a photo dropped into the chat, the ingredients found on
 * Instamart ticking in, and the cart filled for the person to place. It plays as a loop while on screen.
 */
function SwiggyArt() {
  const [ref, on] = useOnScreen<HTMLDivElement>();
  const items = [
    ["Paneer 200g", "₹95"],
    ["Fresh cream", "₹62"],
    ["Butter 100g", "₹56"],
    ["Tomato 1kg", "₹38"],
  ];
  return (
    <div
      ref={ref}
      data-paused={on ? undefined : ""}
      className="sw-loop flex size-full items-center justify-center bg-[radial-gradient(120%_90%_at_70%_10%,#ff9a3d,#fc8019_40%,#c2410c)] pb-[68px] [container-type:size]"
      aria-hidden
    >
      {/* Sized in em from the card's height, so the whole flow fits; wide, short cards lay it out sideways. */}
      <div className="sw-card w-[25em] max-w-[78%] rotate-[-3deg] rounded-[1.6em] bg-white p-[1.1em] text-[length:min(12px,calc((100cqh-68px)/21))] text-[#1c1917] shadow-[0_30px_60px_-20px_rgb(80_20_0/0.55)]">
        <div className="sw-photo ml-auto h-[5.2em] w-[8.6em] rounded-[1em] bg-[linear-gradient(135deg,#fde68a,#f59e0b_55%,#9a3412)]" />
        <p className="mt-[0.8em] leading-snug text-[#57534e]">
          Found <b className="font-semibold text-[#1c1917]">paneer butter masala</b>. On Instamart:
        </p>
        {items.map(([name, price], i) => (
          <div
            key={name}
            className="sw-item flex items-center justify-between border-t border-[#f1efe9] py-[0.5em]"
            style={{ "--i": i } as CSSProperties}
          >
            <span>{name}</span>
            <span className="text-[#78716c]">{price}</span>
          </div>
        ))}
        <div className="sw-cart mt-[0.6em] flex h-[2.7em] items-center justify-between rounded-[0.8em] bg-[#fc8019] px-[1em] font-semibold text-white">
          <span>Added to cart</span>
          <span>₹251</span>
        </div>
      </div>
    </div>
  );
}

/** A still picture for a project without a demo: its website's first screen, a screenshot, or its blueprint. */
function Thumb({ project }: { project: Project }) {
  const picture = project.site?.preview ?? project.images?.[0] ?? project.image;
  if (picture)
    return <Image src={picture} alt="" fill sizes="(min-width: 1024px) 420px, 100vw" className="object-cover object-top" />;
  const arch = architectures[project.slug];
  return arch ? <Blueprint mini arch={arch} accent={accentOf(project)} className="size-full" /> : null;
}

/** The most a project can show on its card: its loop, its site scrolling by, its drawn demo, or a still. */
function Demo({ project }: { project: Project }) {
  if (project.teaser) return <Loop teaser={project.teaser} />;
  if (project.scroll) return <ScrollShot src={project.scroll} />;
  if (project.slug === "swiggy-agent") return <SwiggyArt />;
  return <Thumb project={project} />;
}

/**
 * A project as a piece of glass: its demo fills the card and the caption is a frosted sheet over the bottom, the
 * picture moving behind it. A light rim, a diagonal sheen and a soft glow in the project's colour make it read as
 * an object. The lead card also carries its figures and a "Watch demo" label.
 */
function WorkCard({ project, lead = false }: { project: Project; lead?: boolean }) {
  const stats = lead ? (architectures[project.slug]?.stats.slice(0, 3) ?? []) : [];
  const accent = { "--accent": accentOf(project) } as CSSProperties;
  return (
    <div className="relative isolate h-full">
      <div aria-hidden className="lead-glow" style={{ ...accent, ...(lead ? null : { opacity: 0.4 }) }} />
      <div data-project={project.slug} className="lead-card group relative h-full overflow-hidden rounded-[24px]" style={{ ...grotesk, ...accent }}>
        <div className="absolute inset-0 bg-[var(--stage)]">
          <Demo project={project} />
        </div>
        <div className="absolute inset-x-0 bottom-0">
          {lead && (
            <span className="pointer-events-none absolute bottom-full right-3 mb-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-black/55 px-3 text-[12.5px] font-medium text-white backdrop-blur-md transition-colors duration-300 group-hover:bg-black/75">
              <Play size={11} weight="fill" aria-hidden />
              Watch demo
            </span>
          )}
          <div className={`lead-glass flex flex-wrap items-end justify-between gap-x-6 gap-y-4 ${lead ? "px-[22px] pb-[22px] pt-5" : "px-[18px] pb-4 pt-3.5"}`}>
            <div className="min-w-0">
              {lead && <Meta project={project} className="mb-1.5" />}
              <p className={`font-medium leading-none tracking-[-0.03em] text-[var(--ink)] ${lead ? "text-[26px]" : "text-[20px]"}`}>
                {project.title}
              </p>
              <p className={`mt-1.5 truncate text-[var(--ink-2)] ${lead ? "text-[14px]" : "text-[13px]"}`}>{project.tagline}</p>
            </div>
            {stats.length > 0 && (
              <div className="flex gap-6">
                {stats.map((s) => (
                  <p key={s.label} className="text-[12px] text-[var(--ink-2)]">
                    <span className="block text-[17px] font-medium leading-tight tracking-[-0.02em] tabular-nums text-[var(--ink)]">{s.value}</span>
                    {s.label}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
        {!lead && (
          <span className="lead-chip pointer-events-none absolute left-3 top-3 z-[2] flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] text-[var(--ink-2)]">
            <span className="size-1.5 rounded-full" style={{ background: accentOf(project) }} />
            {project.role ?? "Personal"} · {project.year}
          </span>
        )}
        {!lead && (
          <span className="pointer-events-none absolute right-3 top-3 z-[2] flex size-8 items-center justify-center rounded-full bg-white/90 text-black opacity-0 shadow-sm transition-all duration-300 group-hover:rotate-45 group-hover:opacity-100 [@media(hover:none)]:opacity-0">
            <ArrowUpRight size={14} weight="bold" />
          </span>
        )}
        <span aria-hidden className="lead-sheen pointer-events-none absolute inset-0 rounded-[inherit]" />
        <span aria-hidden className="lead-rim pointer-events-none absolute inset-0 rounded-[inherit]" />
        <OpenButton project={project} rounded="rounded-[24px]" />
      </div>
    </div>
  );
}

/**
 * The Work section: every project as a glass card showing as much of its demo as it can. The lead takes the left
 * two rows on wide screens with the others stacked beside it; on tablets the others sit side by side under it, and
 * on phones everything stacks. Every card opens the project's full view.
 */
export function WorkSection({ projects }: { projects: Project[] }) {
  const [lead, ...rest] = projects;
  return (
    <>
      <h2
        id="work"
        data-ground="Featured"
        className="fade-in flex items-start font-[family-name:var(--font-grotesk)] text-[44px] font-medium leading-none tracking-[-0.035em] text-foreground"
        style={{ animationDelay: "150ms" }}
      >
        Work
        <sup className="ml-1 mt-1 text-[12px] font-normal tracking-normal text-neutral-400">{projects.length}</sup>
      </h2>
      <div className="mt-6 grid gap-[18px] md:grid-cols-2 lg:grid-cols-[1.55fr_1fr] lg:grid-rows-[256px_256px]">
        {lead && (
          <div className="fade-in h-[420px] md:col-span-2 md:h-[440px] lg:col-span-1 lg:row-span-2 lg:h-auto" style={{ animationDelay: "200ms" }}>
            <WorkCard project={lead} lead />
          </div>
        )}
        {rest.map((p, i) => (
          <div key={p.slug} className="fade-in h-[300px] lg:h-auto" style={{ animationDelay: `${260 + i * 60}ms` }}>
            <WorkCard project={p} />
          </div>
        ))}
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

/**
 * The page behind a project sinks back and dims while the project opens over it, and comes forward again on
 * close. Only the part of the page in the window is kept (rounded), so it reads as a card stepping back.
 */
function pushBack(open: boolean, duration: number) {
  const site = document.getElementById("site");
  if (!site) return;
  const top = window.scrollY;
  const view = `inset(${top}px 0px ${site.offsetHeight - top - window.innerHeight}px 0px round 0px)`;
  const back = `inset(${top}px 0px ${site.offsetHeight - top - window.innerHeight}px 0px round 22px)`;
  site.style.transformOrigin = `50% ${top + window.innerHeight / 2}px`;
  document.body.style.background = "#000";
  document.body.dataset.pushed = "";
  const frames = [
    { transform: "none", filter: "brightness(1)", clipPath: view },
    { transform: "scale(0.94)", filter: "brightness(0.55)", clipPath: back },
  ];
  const a = site.animate(open ? frames : frames.reverse(), { duration, easing: EASE, fill: "forwards" });
  if (!open) a.onfinish = settle;
}

/** Puts the page back exactly as it was. */
function settle() {
  const site = document.getElementById("site");
  site?.getAnimations().forEach((x) => x.cancel());
  if (site) site.style.transformOrigin = "";
  document.body.style.background = "";
  delete document.body.dataset.pushed;
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
    else {
      el.animate([{ clipPath: inset(from) }, { clipPath: inset(undefined) }], { duration: 640, easing: EASE });
      pushBack(true, 640);
    }
  }, [from]);

  useEffect(
    () => () => {
      document.documentElement.style.overflow = "";
      settle();
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
    const pushed = !!document.getElementById("site")?.getAnimations().length;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();
    const to = tileRect(project.slug);
    const onScreen = !!to && to.bottom > 0 && to.top < window.innerHeight;
    let anim: Animation;
    let total: number;
    if (onScreen) {
      // The words leave first, then the empty page folds down into its tile and melts into it, so the tile is
      // never shown holding a cropped corner of the project.
      total = 880;
      [...el.children].forEach((c) =>
        c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-in", fill: "forwards" }),
      );
      anim = el.animate(
        [
          { clipPath: inset(undefined), opacity: 1 },
          { opacity: 1, offset: 0.65 },
          { clipPath: inset(to), opacity: 0 },
        ],
        { duration: 800, delay: 80, easing: EASE, fill: "forwards" },
      );
    } else {
      // The tile has scrolled away: the page shrinks back into the distance and fades while Home comes forward.
      total = 640;
      anim = el.animate(
        [
          { transform: "none", opacity: 1, borderRadius: "0px" },
          { transform: "scale(0.9)", opacity: 0, borderRadius: "28px" },
        ],
        { duration: total, easing: EASE, fill: "forwards" },
      );
    }
    if (pushed) pushBack(false, total);
    let done = false;
    const end = () => {
      if (done) return;
      done = true;
      finish();
    };
    anim.onfinish = end;
    setTimeout(end, total + 400);
  }, [onClosed, project.slug]);

  // Next and previous slide sideways: the current project leaves toward one side and the next arrives from the
  // other, the way the arrow points.
  const article = useRef<HTMLElement>(null);
  const slide = useRef(0);
  const switching = useRef(false);
  function switchTo(p: Project, dir: 1 | -1) {
    const el = article.current;
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      pane.current?.scrollTo({ top: 0 });
      onSwitch(p);
    };
    if (switching.current) return;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return go();
    switching.current = true;
    slide.current = dir;
    el.animate(
      [
        { opacity: 1, transform: "none" },
        { opacity: 0, transform: `translateX(${-dir * 48}px)` },
      ],
      { duration: 200, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" },
    ).onfinish = go;
    setTimeout(go, 280);
  }
  useLayoutEffect(() => {
    const dir = slide.current;
    slide.current = 0;
    switching.current = false;
    if (!dir) return;
    article.current?.animate(
      [
        { opacity: 0, transform: `translateX(${dir * 72}px)` },
        { opacity: 1, transform: "none" },
      ],
      { duration: 620, easing: EASE },
    );
  }, [project.slug]);

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
              <button type="button" onClick={() => switchTo(prev, -1)} aria-label={`Previous project: ${prev.title}`} className={iconBtn}>
                <ArrowLeft size={15} />
              </button>
              <button type="button" onClick={() => switchTo(next, 1)} aria-label={`Next project: ${next.title}`} className={`${iconBtn} -mr-2`}>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>

        <article ref={article} key={project.slug} className="mx-auto max-w-[1240px] px-5 pb-16 sm:px-8">
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
            onClick={() => switchTo(next, 1)}
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
 * A live website shown as its first screen in a quiet browser frame. The whole thing is the link: hovering
 * lifts the picture a touch and brings up "Visit site"; on touch screens the label is always shown.
 */
function SitePreview({ site, title }: { site: NonNullable<Project["site"]>; title: string }) {
  const host = new URL(site.href).host;
  return (
    <a
      href={site.href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Visit the ${title} website (opens in a new tab)`}
      className="group block overflow-hidden rounded-[20px] bg-[var(--stage)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-2)]"
    >
      <div className="flex h-10 items-center gap-3 px-4">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-[var(--ink-3)] opacity-60" />
          <span className="size-2.5 rounded-full bg-[var(--ink-3)] opacity-60" />
          <span className="size-2.5 rounded-full bg-[var(--ink-3)] opacity-60" />
        </span>
        <span className="mx-auto flex h-6 min-w-0 items-center gap-1.5 truncate rounded-full bg-[var(--background)] px-3 font-[family-name:var(--font-inter)] text-[12px] text-[var(--ink-2)]">
          {host}
        </span>
        <span className="w-[42px]" aria-hidden />
      </div>
      <div className="relative mx-2.5 mb-2.5 overflow-hidden rounded-[12px]">
        <Image
          src={site.preview}
          alt={`The ${title} website`}
          width={1600}
          height={1000}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="block h-auto w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.025]"
        />
        <span className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/20" aria-hidden />
        <span className="absolute bottom-4 right-4 inline-flex h-10 items-center gap-2 rounded-full bg-[var(--ink)] px-5 text-[14px] font-medium text-[var(--background)] opacity-0 shadow-[0_8px_24px_-8px_rgb(0_0_0/0.45)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] [transform:translateY(6px)] group-hover:opacity-100 group-hover:[transform:none] group-focus-visible:opacity-100 group-focus-visible:[transform:none] [@media(hover:none)]:opacity-100 [@media(hover:none)]:[transform:none]">
          Visit site
          <ArrowUpRight size={14} />
        </span>
      </div>
    </a>
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
  const site = project.site;

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
          stageClass={video || site ? "h-[420px] lg:h-full" : "h-[420px] lg:h-[520px]"}
        />
      </div>
    </section>
  );

  if (!video && !site)
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
          {site ? (
            <SitePreview site={site} title={project.title} />
          ) : (
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
          )}
        </section>
        <div className="hidden lg:block">{ideas}</div>
      </div>
      {stage}
      <div className="lg:hidden">{ideas}</div>
    </div>
  );
}
