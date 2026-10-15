"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowUpRight, CaretLeft, CaretRight, X } from "@phosphor-icons/react/dist/ssr";
import type { Project } from "@/data/site";
import { Icon } from "./Icon";
import { ListItemBody, rowClass } from "./ListItem";
import { ProjectTile } from "./ProjectTile";

const OpenProject = createContext<(slug: string) => void>(() => {});
export const useOpenProject = () => useContext(OpenProject);

/** Holds every project and renders one shared detail sheet. */
export function ProjectsProvider({
  projects,
  children,
}: {
  projects: Project[];
  children: ReactNode;
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [open, setOpen] = useState(false);

  const openProject = useCallback(
    (slug: string) => {
      const p = projects.find((x) => x.slug === slug);
      if (!p) return;
      setProject(p);
      setOpen(true);
    },
    [projects],
  );

  return (
    <OpenProject.Provider value={openProject}>
      {children}
      {project && <ProjectSheet project={project} open={open} onClose={() => setOpen(false)} />}
    </OpenProject.Provider>
  );
}

export function ProjectRow({ project }: { project: Project }) {
  const open = useOpenProject();
  return (
    <button
      type="button"
      className={`${rowClass} cursor-pointer`}
      onClick={() => open(project.slug)}
      aria-haspopup="dialog"
    >
      <ListItemBody
        icon={<Icon name={project.icon} />}
        title={project.title}
        subtitle={project.tagline}
      />
    </button>
  );
}

/** Renders **bold** spans in a point. */
function rich(text: string) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 ? (
      <strong key={i} className="font-semibold text-foreground">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

/** Hero of the sheet: one image, or a swipeable set of screenshots with arrows and dots. */
function Gallery({ project, open }: { project: Project; open: boolean }) {
  const images = project.images ?? [];
  const video = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const many = images.length > 1;

  useEffect(() => {
    if (!many) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [many, images.length]);

  // Play the demo only while the sheet is open.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (open) void v.play().catch(() => {});
    else v.pause();
  }, [open]);

  if (project.video) {
    return (
      <video
        ref={video}
        src={project.video}
        className="absolute inset-0 size-full bg-black object-cover"
        muted
        loop
        playsInline
        controls
        preload="metadata"
        aria-label={`${project.title} demo video`}
      />
    );
  }

  if (!images.length) return <ProjectTile project={project} sizes="460px" showText={false} />;

  const go = (d: number) => setIndex((i) => (i + d + images.length) % images.length);
  const arrow =
    "absolute top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-md transition-all hover:bg-black/60 group-hover/gallery:opacity-100 focus-visible:opacity-100";

  return (
    <div className="group/gallery absolute inset-0">
      <a
        href={images[index]}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open screenshot ${index + 1} full size`}
        className="absolute inset-0 block"
      >
        <ProjectTile project={{ ...project, images: [images[index]] }} sizes="460px" showText={false} />
      </a>
      {many && (
        <>
          <button type="button" onClick={() => go(-1)} className={`${arrow} left-2.5`} aria-label="Previous screenshot">
            <CaretLeft size={14} weight="bold" />
          </button>
          <button type="button" onClick={() => go(1)} className={`${arrow} right-2.5`} aria-label="Next screenshot">
            <CaretRight size={14} weight="bold" />
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1" aria-hidden>
            {images.map((src, i) => (
              <span
                key={src}
                className={`h-1 rounded-full bg-white shadow transition-all duration-300 ${i === index ? "w-3" : "w-1 opacity-60"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ProjectSheet({
  project,
  open,
  onClose,
}: {
  project: Project;
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`sheet m-auto w-[calc(100%-2rem)] ${project.wide ? "max-w-[760px]" : "max-w-[460px]"} overflow-visible bg-transparent p-0 text-foreground outline-none backdrop:bg-transparent`}
      aria-labelledby="project-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-background p-2 shadow-[0_24px_64px_-16px_rgb(0_0_0/0.25),0_0_0_1px_rgb(0_0_0/0.05)] dark:shadow-[0_24px_64px_-16px_rgb(0_0_0/0.8),0_0_0_1px_rgb(255_255_255/0.08)]">
        <div
          className={`relative overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900 ${project.video ? "aspect-video" : "aspect-[16/10]"}`}
        >
          <Gallery key={project.slug} project={project} open={open} />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2.5 top-2.5 flex size-7 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60"
            aria-label="Close"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        <div className={project.wide ? "px-5 pb-5 pt-6" : "px-4 pb-4 pt-5"}>
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="project-title" className={`font-semibold tracking-tight ${project.wide ? "text-lg" : "text-base"}`}>
              {project.title}
            </h2>
            <span className="text-xs tabular-nums text-neutral-400 dark:text-neutral-600">
              {[project.role, project.year].filter(Boolean).join(" · ")}
            </span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{project.tagline}</p>

          <ul className={project.wide ? "mt-5 grid gap-x-10 gap-y-4 sm:grid-cols-2" : "mt-4 flex flex-col gap-2.5"}>
            {project.points.map((pt) => {
              return (
              <li
                key={pt}
                className="relative pl-4 text-sm leading-[1.55] text-neutral-600 before:absolute before:left-0 before:top-[0.6em] before:size-1 before:rounded-full before:bg-neutral-300 dark:text-neutral-400 dark:before:bg-neutral-700"
              >
                {rich(pt)}
              </li>
              );
            })}
          </ul>

          <div className="mt-5 flex flex-wrap gap-1.5">
            {project.stack.map((s) => (
              <span
                key={s}
                className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"
              >
                {s}
              </span>
            ))}
          </div>

          {project.links && project.links.length > 0 && (
            <div className="mt-5 flex gap-2">
              {project.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-neutral-700 active:scale-[0.97] dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                >
                  {l.label}
                  <ArrowUpRight size={13} weight="bold" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
