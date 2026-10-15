"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/data/site";
import { useOpenProject } from "./Projects";
import { ProjectTile } from "./ProjectTile";

/** Auto-cycling preview of featured work. Pauses on hover; click opens the project. */
export function Showcase({ projects }: { projects: Project[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const open = useOpenProject();

  useEffect(() => {
    if (paused || projects.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % projects.length), 4000);
    return () => clearInterval(id);
  }, [paused, projects.length]);

  const current = projects[index];

  return (
    <div>
      <button
        type="button"
        onClick={() => open(current.slug)}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className="group/card relative block aspect-[16/10] w-full cursor-pointer overflow-hidden rounded-xl bg-neutral-100 shadow-[0_0_0_1px_rgb(0_0_0/0.06)] outline-none transition-transform duration-200 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-neutral-300 dark:bg-neutral-900 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.06)]"
        aria-label={`View ${current.title}`}
      >
        {projects.map((p, i) => (
          <span
            key={p.slug}
            className="absolute inset-0 transition-[opacity,filter,transform] duration-700 ease-out"
            style={{
              opacity: i === index ? 1 : 0,
              filter: i === index ? "blur(0)" : "blur(6px)",
              transform: i === index ? "scale(1)" : "scale(1.02)",
            }}
            aria-hidden={i !== index}
          >
            <ProjectTile project={p} sizes="(min-width: 860px) 320px, 100vw" priority={i === 0} />
          </span>
        ))}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/0 transition-colors duration-200 group-hover/card:bg-white/10">
          <span className="translate-y-1 rounded-full bg-neutral-900/50 px-3.5 py-1.5 text-sm font-medium text-white opacity-0 shadow-lg backdrop-blur-md transition-all duration-200 group-hover/card:translate-y-0 group-hover/card:opacity-100 group-focus-visible/card:translate-y-0 group-focus-visible/card:opacity-100">
            View work
          </span>
        </span>
      </button>

      <div className="mt-2 flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-600">
        <span key={current.slug} className="blur-in">
          {current.title}
        </span>
        <span className="flex gap-1" aria-hidden>
          {projects.map((p, i) => (
            <span
              key={p.slug}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === index ? "w-3 bg-neutral-400 dark:bg-neutral-500" : "w-1 bg-neutral-200 dark:bg-neutral-800"
              }`}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
