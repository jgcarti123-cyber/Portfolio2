"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { delay } from "./Section";

type Item = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  dateLabel: string;
  tag: string;
  cover: string;
  coverPosition: string;
  minutes: number;
  draft: boolean;
};

const mono = "font-[family-name:var(--font-mono)]";

/** Every post as one numbered row, filtered by tag. */
export function BlogList({ posts }: { posts: Item[] }) {
  const tags = ["All", ...Array.from(new Set(posts.map((p) => p.tag)))];
  const [tag, setTag] = useState("All");
  const shown = tag === "All" ? posts : posts.filter((p) => p.tag === tag);
  // The open row stays open until another row is hovered or the mouse leaves the list, and the list keeps
  // its tallest height meanwhile, so rows sliding up as one closes never pull the next out from under the mouse.
  const [open, setOpen] = useState<string | null>(null);
  const [floor, setFloor] = useState(0);
  const list = useRef<HTMLOListElement>(null);

  if (!posts.length)
    return <p className={`fade-in pt-1 text-[15px] text-[var(--ink-2)]`}>The first post is on its way.</p>;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Filter by topic"
        className={`fade-in flex gap-5 overflow-x-auto border-b border-[var(--hair)] pb-3.5 text-xs font-medium uppercase tracking-[0.02em] ${mono}`}
      >
        {tags.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={t === tag}
            onClick={() => setTag(t)}
            className={`shrink-0 cursor-pointer rounded-sm outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-neutral-300 ${t === tag ? "text-[var(--ink)]" : "text-[var(--ink-2)] hover:text-[var(--ink)]"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Every post as a numbered line. With a mouse, the hovered line opens to show its cover and summary while the others soften. */}
      <ol
        ref={list}
        className="blog-rows pt-2"
        data-active={open ? "" : undefined}
        style={open ? { minHeight: floor } : undefined}
        onPointerLeave={() => {
          setOpen(null);
          setFloor(0);
        }}
      >
        {shown.map((p, i) => (
          <li
            key={p.slug}
            className="blog-row fade-in"
            style={delay(60 + i * 40)}
            data-on={open === p.slug ? "" : undefined}
            onPointerEnter={(e) => {
              if (e.pointerType !== "mouse") return;
              setOpen(p.slug);
              // Measure once the row has finished opening and keep the tallest height seen.
              setTimeout(() => setFloor((f) => Math.max(f, list.current?.offsetHeight ?? 0)), 560);
            }}
          >
            <Link
              href={`/blog/${p.slug}`}
              className="group/row -mx-3 grid grid-cols-[32px_1fr_auto] items-baseline gap-x-4 gap-y-1 rounded-lg border-b border-[var(--hair)] px-3 py-4 outline-none transition-colors duration-200 hover:bg-[var(--stage)] focus-visible:bg-[var(--stage)] sm:grid-cols-[40px_112px_1fr_100px_52px_20px]"
            >
              <span className={`text-[12.5px] tabular-nums text-[var(--ink-2)] transition-colors duration-200 group-hover/row:text-[var(--ink)] ${mono}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className={`order-3 col-start-2 col-span-2 text-[12.5px] text-[var(--ink-2)] sm:order-none sm:col-span-1 sm:col-start-auto ${mono}`}>
                {p.dateLabel}
                <span className="sm:hidden"> · {p.tag} · {p.minutes} min</span>
              </span>
              <h3 className="font-[family-name:var(--font-grotesk)] text-lg font-medium leading-[1.3] tracking-[-0.015em] text-[var(--ink)] transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover/row:translate-x-1 sm:text-[19px]">
                {p.title}
                {p.draft && <span className={`ml-2 align-middle text-[11px] text-[var(--ink-2)] ${mono}`}>DRAFT</span>}
              </h3>
              <span className={`hidden text-[12.5px] text-[var(--ink-2)] sm:block ${mono}`}>{p.tag}</span>
              <span className={`hidden text-right text-[12.5px] text-[var(--ink-2)] sm:block ${mono}`}>{p.minutes} min</span>
              <ArrowRight
                size={15}
                weight="bold"
                aria-hidden
                className="self-center -translate-x-2 text-[var(--ink)] opacity-0 transition-all duration-300 ease-[var(--ease-out-soft)] group-hover/row:translate-x-0 group-hover/row:opacity-100 group-focus-visible/row:translate-x-0 group-focus-visible/row:opacity-100"
              />
              <div aria-hidden className="blog-row-open col-span-full hidden">
                <div className="overflow-hidden">
                  <div className="grid grid-cols-[40px_112px_1fr] gap-x-4 pb-1 pt-4">
                    <div className="relative col-start-2 col-span-2 aspect-[3.4/1] overflow-hidden rounded-xl bg-[var(--background)]">
                      <Image
                        src={p.cover}
                        alt=""
                        fill
                        quality={92}
                        sizes="620px"
                        className="object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover/row:scale-[1.03]"
                        style={{ objectPosition: p.coverPosition }}
                      />
                    </div>
                    {p.summary && (
                      <p className="col-start-2 col-span-2 mt-3 max-w-[560px] text-[15px] leading-[1.55] text-[var(--ink-2)]">{p.summary}</p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
