import fs from "node:fs";
import path from "node:path";
import type { Project } from "@/data/site";

const IMAGE = /\.(png|jpe?g|webp|avif|gif)$/i;
const VIDEO = /\.(mp4|webm|mov)$/i;

/** Files dropped into public/work/<slug>/, in natural order (2.png before 10.png). */
function filesFor(slug: string): string[] {
  try {
    return fs
      .readdirSync(path.join(process.cwd(), "public", "work", slug))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((f) => `/work/${slug}/${f}`);
  } catch {
    return [];
  }
}

export function withGallery<T extends Project>(projects: T[]): T[] {
  return projects.map((p) => {
    const files = filesFor(p.slug);
    const images = files.filter((f) => IMAGE.test(f));
    const video = files.find((f) => VIDEO.test(f));
    return {
      ...p,
      ...(images.length ? { images } : {}),
      ...(video ? { video } : {}),
    };
  });
}
