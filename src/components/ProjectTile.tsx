"use client";

import Image from "next/image";
import { useState } from "react";
import type { Project } from "@/data/site";
import { Icon } from "./Icon";

/** Screenshot if one exists, otherwise a quiet typographic tile tinted by the project accent. */
export function ProjectTile({
  project,
  sizes,
  priority,
  showText = true,
}: {
  project: Project;
  sizes: string;
  priority?: boolean;
  /** Hide the title when it is already shown next to the tile. */
  showText?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  const image = project.images?.[0] ?? project.image;
  if (image && !failed) {
    return (
      <Image
        src={image}
        alt={`${project.title} screenshot`}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover object-top"
        onError={() => setFailed(true)}
      />
    );
  }

  // A demo video without screenshots: show a still frame (only metadata and one frame load).
  if (project.video) {
    return (
      <video
        src={`${project.video}#t=4`}
        className="absolute inset-0 size-full bg-black object-cover"
        muted
        playsInline
        preload="metadata"
        aria-hidden
      />
    );
  }

  const accent = project.accent ?? "#737373";
  return (
    <div
      className="absolute inset-0 flex flex-col justify-between bg-neutral-950 p-5 text-white"
      style={{
        backgroundImage: `radial-gradient(120% 90% at 100% 0%, ${accent}55 0%, transparent 55%), radial-gradient(90% 80% at 0% 100%, ${accent}22 0%, transparent 60%)`,
      }}
    >
      <span
        className="flex size-9 items-center justify-center rounded-[10px] ring-1 ring-white/10"
        style={{ background: `${accent}33`, color: accent }}
      >
        <Icon name={project.icon} size={18} />
      </span>
      <span className={showText ? undefined : "invisible"}>
        <span className="block text-lg font-semibold tracking-tight">{project.title}</span>
        <span className="block text-sm text-white/55">{project.tagline}</span>
      </span>
    </div>
  );
}
