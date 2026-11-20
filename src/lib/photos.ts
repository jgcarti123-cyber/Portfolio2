import "server-only";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * The personal photos that fan out of John's name in the header, read from public/Photos (up to five). They
 * go into the fan in file-name order, left to right, so the number at the start of each name sets its place
 * (3 is the middle). With no photos there, the name shows no fan.
 */

/** ratio is width ÷ height (1 if it can't be read). */
export type Photo = { src: string; ratio: number };

const DIR = path.join(process.cwd(), "public/Photos");

/** Reads the pixel size from a JPEG's frame header (enough to tell portrait from landscape). */
function jpegSize(buf: Buffer): { w: number; h: number } | null {
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc)
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  return null;
}

export function getPhotos(): Photo[] {
  let files: string[] = [];
  try {
    files = readdirSync(DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
  } catch {
    return [];
  }
  return files.slice(0, 5).map((f) => {
    let ratio = 1;
    try {
      const size = /\.jpe?g$/i.test(f) ? jpegSize(readFileSync(path.join(DIR, f))) : null;
      if (size) ratio = size.w / size.h;
    } catch {}
    return { src: `/Photos/${encodeURIComponent(f)}`, ratio };
  });
}
