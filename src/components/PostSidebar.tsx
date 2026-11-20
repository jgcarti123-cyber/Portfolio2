"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/blog";

const mono = "font-[family-name:var(--font-mono)]";
const label = "text-xs uppercase tracking-[0.04em] text-[var(--ink-2)] opacity-70";
const branch = <span aria-hidden className="mr-2 text-[var(--ink-3)]">└</span>;

/** Tracks which section is being read and how far through the article the reader is. */
function useReading(headings: Heading[]) {
  const [active, setActive] = useState(headings[0]?.id ?? "");
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const body = document.getElementById("post-body");
    let raf = 0;
    const update = () => {
      raf = 0;
      if (!body) return;
      const r = body.getBoundingClientRect();
      const span = r.height - window.innerHeight * 0.6;
      setProgress(Math.round(Math.min(1, Math.max(0, (window.innerHeight * 0.4 - r.top) / Math.max(1, span))) * 100));
      let current = headings[0]?.id ?? "";
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.3) current = h.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [headings]);
  return { active, progress };
}

function Tree({ headings, active, onPick }: { headings: Heading[]; active: string; onPick?: () => void }) {
  return (
    <ul>
      {headings.map((h) => (
        <li key={h.id}>
          <a
            href={`#${h.id}`}
            onClick={onPick}
            aria-current={h.id === active ? "location" : undefined}
            className={`block truncate rounded-sm py-[3px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-neutral-300 ${h.depth === 3 ? "pl-[22px]" : ""} ${h.id === active ? "text-[var(--ink)]" : "text-[var(--ink-2)] hover:text-[var(--ink)]"}`}
          >
            {branch}
            {h.text}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** A bar of fine dots that fills solid as you read. */
function Progress({ value, minutes }: { value: number; minutes: number }) {
  return (
    <div>
      <div className="flex items-center gap-2.5 text-[var(--ink-2)]">
        <span
          className="relative h-3.5 w-[180px] overflow-hidden rounded-[2px]"
          role="progressbar"
          aria-label="Reading progress"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, var(--ink-3) 0 1px, transparent 1px 3px), repeating-linear-gradient(0deg, var(--ink-3) 0 1px, transparent 1px 3px)",
          }}
        >
          <span className="absolute inset-y-0 left-0 bg-[var(--ink)] transition-[width] duration-150" style={{ width: `${value}%` }} />
        </span>
        <span className="tabular-nums">{value}%</span>
      </div>
      <div className="mt-1 uppercase">{minutes} min read</div>
    </div>
  );
}

function ShareLinks({ title, markdown }: { title: string; markdown: string }) {
  const [copied, setCopied] = useState<"" | "url" | "md">("");
  const url = () => window.location.href.split("#")[0];
  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");
  const copy = async (what: "url" | "md") => {
    try {
      await navigator.clipboard.writeText(what === "url" ? url() : `# ${title}\n\n${markdown}\n`);
      setCopied(what);
      setTimeout(() => setCopied(""), 1600);
    } catch {}
  };
  const items: [string, () => void][] = [
    ["X.com", () => open(`https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url())}`)],
    ["LinkedIn", () => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url())}`)],
    ["Email", () => (window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url())}`)],
    [copied === "url" ? "Copied" : "Copy URL", () => copy("url")],
    [copied === "md" ? "Copied" : "Copy markdown", () => copy("md")],
  ];
  return (
    <ul>
      {items.map(([name, run], i) => (
        <li key={i}>
          <button
            type="button"
            onClick={run}
            className="cursor-pointer rounded-sm py-[3px] text-left text-[var(--ink-2)] outline-none transition-colors duration-150 hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-neutral-300"
          >
            {branch}
            <span className={name === "Copied" ? "text-[var(--ink)]" : ""}>{name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

type Props = { headings: Heading[]; minutes: number; title: string; markdown: string };

/** Desktop: the tree, progress and share links, pinned beside the text, with share at the bottom of the window. */
export function PostSidebar({ headings, minutes, title, markdown }: Props) {
  const { active, progress } = useReading(headings);
  return (
    <aside
      className={`sticky top-8 hidden h-[calc(100vh-64px)] flex-col justify-between self-start text-[13px] leading-[1.75] desktop:flex ${mono}`}
    >
      <div>
        {headings.length > 0 && (
          <nav aria-label="Contents">
            <div className={`mb-1.5 ${label}`}>Tree</div>
            <Tree headings={headings} active={active} />
          </nav>
        )}
        <div className="mt-6">
          <Progress value={progress} minutes={minutes} />
        </div>
      </div>
      <div className="pb-2">
        <div className={`mb-1.5 ${label}`}>Share</div>
        <ShareLinks title={title} markdown={markdown} />
      </div>
    </aside>
  );
}

/** Phone and tablet: the same tree and share links, folded into two chips above the text. */
export function PostChips({ headings, minutes, title, markdown }: Props) {
  const { active, progress } = useReading(headings);
  const [open, setOpen] = useState<"" | "tree" | "share">("");
  const chip = (on: boolean) =>
    `cursor-pointer rounded-full px-3 py-1.5 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-neutral-300 ${on ? "bg-[var(--ink)] text-[var(--background)]" : "bg-[var(--stage)] text-[var(--ink)]"}`;
  return (
    <div className={`sticky top-0 z-10 -mx-5 bg-background px-5 py-3 text-xs desktop:hidden ${mono}`}>
      <div className="flex items-center gap-2">
        {headings.length > 0 && (
          <button type="button" aria-expanded={open === "tree"} onClick={() => setOpen(open === "tree" ? "" : "tree")} className={chip(open === "tree")}>
            Contents {open === "tree" ? "▴" : "▾"}
          </button>
        )}
        <button type="button" aria-expanded={open === "share"} onClick={() => setOpen(open === "share" ? "" : "share")} className={chip(open === "share")}>
          Share
        </button>
        <span className="ml-auto tabular-nums text-[var(--ink-2)]">
          {progress}% · {minutes} min
        </span>
      </div>
      {open && (
        <div className="mt-3 border-t border-[var(--hair)] pt-3 text-[13px] leading-[1.75]">
          {open === "tree" ? (
            <Tree headings={headings} active={active} onPick={() => setOpen("")} />
          ) : (
            <ShareLinks title={title} markdown={markdown} />
          )}
        </div>
      )}
    </div>
  );
}
