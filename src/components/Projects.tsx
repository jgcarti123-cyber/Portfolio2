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
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from "@phosphor-icons/react/dist/ssr";
import { architectures } from "@/data/architecture";
import type { Project } from "@/data/site";
import { tellMascot } from "@/lib/mascot";
import { Blueprint } from "./Blueprint";
import { Segmented } from "./Segmented";

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
function Tile({ project, hero = false, className = "" }: { project: Project; hero?: boolean; className?: string }) {
  const open = useOpenProject();
  const arch = architectures[project.slug];
  const stats = arch?.stats ?? [];
  const accent = accentOf(project);

  return (
    <div
      data-project={project.slug}
      className={`group relative flex overflow-hidden rounded-[22px] bg-[var(--stage)] p-2 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 has-[button:active]:scale-[0.995] ${
        hero ? "min-h-[300px] flex-col-reverse gap-2 sm:flex-row" : "min-h-[220px] gap-2"
      } ${className}`}
      style={grotesk}
    >
      <div className={`flex flex-1 flex-col justify-between ${hero ? "p-5 sm:p-6" : "p-4"}`} aria-hidden>
        <span className="flex items-center gap-2 text-[12px] text-[var(--ink-2)]">
          <span className="size-1.5 rounded-full" style={{ background: accent }} />
          {project.role ?? "Personal"} · {project.year}
        </span>
        <span className="block">
          <span
            className={`block font-medium tracking-[-0.03em] text-[var(--ink)] ${
              hero ? "text-[clamp(36px,4vw,56px)] leading-[0.95]" : "text-[22px] leading-6"
            }`}
          >
            {project.title}
          </span>
          <span className={`mt-1.5 block text-[var(--ink-2)] ${hero ? "text-[16px]" : "text-[14px] leading-5"}`}>{project.tagline}</span>
          {hero ? (
            <span className="mt-7 flex flex-wrap gap-x-7 gap-y-3">
              {stats.slice(0, 3).map((s) => (
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
          className={`shrink-0 rounded-[16px] ${hero ? "h-[220px] sm:h-auto sm:w-[56%]" : "w-[44%]"}`}
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

/** A compact grid with AIVA taking the top-left two-by-two. */
export function ProjectBento({ projects }: { projects: Project[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:auto-rows-[228px] lg:grid-cols-3">
      {projects.map((p, i) => {
        const hero = p.slug === "aiva";
        return (
          <div
            key={p.slug}
            className={`fade-in flex ${hero ? "md:col-span-2 lg:row-span-2" : ""}`}
            style={{ animationDelay: `${200 + i * 60}ms` }}
          >
            <Tile project={p} hero={hero} className="w-full" />
          </div>
        );
      })}
    </div>
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
  const [tab, setTab] = useState<"layers" | "demo">("layers");

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
    setTab("layers");
    onSwitch(p);
  }

  const next = projects[(projects.findIndex((p) => p.slug === project.slug) + 1) % projects.length];

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
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-[var(--background)]/85 px-5 py-3 backdrop-blur-xl sm:px-10">
          <button
            type="button"
            onClick={close}
            className="flex cursor-pointer items-center gap-1.5 text-[14px] text-[var(--ink-2)] outline-none transition-colors hover:text-[var(--ink)] focus-visible:text-[var(--ink)]"
          >
            <ArrowLeft size={14} weight="bold" /> Work
          </button>
          {project.video && (
            <Segmented
              label="View"
              value={tab}
              onChange={(k) => setTab(k as "layers" | "demo")}
              options={[
                { key: "layers", label: "Architecture" },
                { key: "demo", label: "Demo" },
              ]}
            />
          )}
          <button
            type="button"
            onClick={close}
            className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-[var(--surface)] text-[var(--ink)] outline-none transition-transform hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--ink-2)]"
            aria-label="Close"
          >
            <X size={15} weight="bold" />
          </button>
        </div>

        <div key={project.slug} className="px-5 pb-20 sm:px-10">
          <div className="fade-in mt-4 flex flex-col gap-8 lg:mt-6 lg:flex-row lg:items-end lg:justify-between" style={{ animationDelay: "120ms" }}>
            <div>
              <p className="flex items-center gap-2 text-[13px] text-[var(--ink-2)]">
                {isWork(project) ? "■" : "□"} {[project.role, project.year].filter(Boolean).join(" · ")}
              </p>
              <h2
                id="project-title"
                className="mt-2 text-[clamp(52px,8vw,112px)] font-medium leading-[0.92] tracking-[-0.045em] text-[var(--ink)]"
              >
                {project.title}
              </h2>
              <p className="mt-3 text-[clamp(18px,1.8vw,24px)] tracking-[-0.015em] text-[var(--ink-2)]">{project.tagline}</p>
            </div>
            {arch && (
              <dl className="flex flex-wrap gap-x-10 gap-y-5">
                {arch.stats.map((s) => (
                  <div key={s.label}>
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="text-[clamp(28px,2.8vw,40px)] font-medium leading-none tracking-[-0.03em] text-[var(--ink)] tabular-nums">
                      {s.value}
                    </dd>
                    <dd className="mt-1.5 max-w-[16ch] text-[13px] leading-4 text-[var(--ink-2)]">{s.label}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <div data-ground="sheet" className="fade-in mt-10" style={{ animationDelay: "220ms" }}>
            {tab === "demo" && project.video ? (
              <video src={project.video} className="aspect-video w-full rounded-[28px] bg-black object-contain" controls autoPlay muted loop playsInline />
            ) : arch ? (
              <Architecture key={project.slug} project={project} />
            ) : null}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-1.5">
            {project.stack.map((s) => (
              <span key={s} className="bg-[var(--surface)] px-2.5 py-1 text-[14px] text-[var(--ink)]">
                {s}
              </span>
            ))}
            {project.links?.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="ml-2 inline-flex items-center gap-1.5 bg-[var(--ink)] px-3.5 py-1.5 text-[14px] font-medium text-[var(--background)] transition-transform hover:-translate-y-0.5"
              >
                {l.label}
                <ArrowUpRight size={13} weight="bold" />
              </a>
            ))}
          </div>

          <button
            type="button"
            onClick={() => switchTo(next)}
            className="bt-item group mt-16 flex w-full cursor-pointer items-end justify-between gap-6 border-t border-[var(--hair)] pt-8 text-left outline-none"
          >
            <span>
              <span className="block text-[13px] text-[var(--ink-2)]">Next</span>
              <span className="bt-hl mt-1 text-[clamp(36px,5vw,72px)] font-medium leading-none tracking-[-0.04em]">
                <span>{next.title}</span>
                <span className="bt-grad" aria-hidden>
                  {next.title}
                </span>
              </span>
            </span>
            <ArrowRight size={28} className="mb-2 shrink-0 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </dialog>
  );
}

/** The blueprint with what it rests on beside it: a few principles, the layers and the stack. No walkthrough. */
function Architecture({ project }: { project: Project }) {
  const arch = architectures[project.slug];
  const accent = accentOf(project);
  return (
    <div className="grid overflow-hidden rounded-[28px] bg-[#0a0b0c] text-white lg:grid-cols-[1fr_330px]">
      <Blueprint arch={arch} accent={accent} video={project.video} title={project.title} />
      <aside className="flex flex-col gap-8 border-t border-white/10 p-6 sm:p-8 lg:border-l lg:border-t-0">
        {arch.principles && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">Built on</p>
            <ol className="mt-4 flex flex-col gap-4">
              {arch.principles.map((t, i) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-1.5 font-mono text-[11px] text-white/35">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[19px] font-medium leading-6 tracking-[-0.02em]">{t}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">Layers</p>
          <ol className="mt-3 flex flex-col gap-1.5 font-mono text-[12px] uppercase tracking-[0.1em] text-white/55">
            {arch.layers.map((l, i) => (
              <li key={l.name}>
                {String(i + 1).padStart(2, "0")} — {l.name}
              </li>
            ))}
          </ol>
        </div>
        {arch.footnote && <p className="text-[13px] leading-snug text-white/50">{arch.footnote}</p>}
      </aside>
    </div>
  );
}
