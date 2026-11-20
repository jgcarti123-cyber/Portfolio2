import "server-only";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Marked } from "marked";

/**
 * Blog posts are Markdown files in content/blog. Each starts with a small header between --- lines:
 *
 *   ---
 *   title: The post's title
 *   summary: One sentence under the title and in the list
 *   date: 2026-11-20
 *   tag: Agents
 *   cover: /blog/my-panorama.jpg      (optional; a wide picture in public/, defaults to the header sky)
 *   coverPosition: center 40%         (optional; which part of the picture the crop keeps)
 *   draft: true                       (optional; drafts show while running locally, never on the live site)
 *   ---
 *
 * The file name is the address: content/blog/hello-world.md becomes /blog/hello-world.
 */

const DIR = path.join(process.cwd(), "content/blog");

export type Heading = { depth: 2 | 3; text: string; id: string };

export type PostMeta = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  tag: string;
  cover: string;
  coverPosition: string;
  draft: boolean;
  minutes: number;
};

export type Post = PostMeta & { html: string; headings: Heading[]; markdown: string };

const showDrafts = process.env.NODE_ENV !== "production";

function parseFront(file: string) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(file);
  const data: Record<string, string> = {};
  if (!m) return { data, body: file };
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i < 1) continue;
    data[line.slice(0, i).trim()] = line
      .slice(i + 1)
      .trim()
      .replace(/^(["'])(.*)\1$/, "$2");
  }
  return { data, body: m[2] };
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;|&#\d+;/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

function render(markdown: string) {
  const headings: Heading[] = [];
  const used = new Map<string, number>();
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        if (depth !== 2 && depth !== 3) return `<h${depth}>${inner}</h${depth}>\n`;
        const text = inner.replace(/<[^>]+>/g, "").replace(/&#39;/g, "’").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
        let id = slugify(text) || "section";
        const n = used.get(id) ?? 0;
        used.set(id, n + 1);
        if (n) id += `-${n}`;
        headings.push({ depth, text, id });
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const inner = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href);
        const t = title ? ` title="${title}"` : "";
        return `<a href="${href}"${t}${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${inner}</a>`;
      },
    },
  });
  const html = marked.parse(markdown, { async: false }) as string;
  return { html, headings };
}

function read(slug: string): Post | null {
  let file: string;
  try {
    file = readFileSync(path.join(DIR, `${slug}.md`), "utf8");
  } catch {
    return null;
  }
  const { data, body } = parseFront(file);
  const draft = data.draft === "true";
  if (draft && !showDrafts) return null;
  const words = body.split(/\s+/).filter(Boolean).length;
  return {
    slug,
    title: data.title ?? slug,
    summary: data.summary ?? "",
    date: data.date ?? "",
    tag: data.tag ?? "Notes",
    cover: data.cover || "/header-sky.jpg",
    coverPosition: data.coverPosition || "center",
    draft,
    minutes: Math.max(1, Math.round(words / 220)),
    markdown: body.trim(),
    ...render(body),
  };
}

export function getPost(slug: string) {
  return read(slug);
}

/** Every post that can be shown, newest first. */
export function getPosts(): PostMeta[] {
  let files: string[] = [];
  try {
    files = readdirSync(DIR).filter((f) => f.endsWith(".md"));
  } catch {}
  return files
    .map((f) => read(f.replace(/\.md$/, "")))
    .filter((p): p is Post => !!p)
    .map((p): PostMeta => {
      const meta: Partial<Post> = { ...p };
      delete meta.html;
      delete meta.headings;
      delete meta.markdown;
      return meta as PostMeta;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" });
}
