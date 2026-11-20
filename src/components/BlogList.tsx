"use client";

import { useState } from "react";
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

/** The newest post as a wide card, then every other post as one row each, filtered by tag. */
export function BlogList({ posts }: { posts: Item[] }) {
  const tags = ["All", ...Array.from(new Set(posts.map((p) => p.tag)))];
  const [tag, setTag] = useState("All");
  const shown = tag === "All" ? posts : posts.filter((p) => p.tag === tag);
  const [first, ...rest] = shown;

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

      {first && (
        <Link
          href={`/blog/${first.slug}`}
          style={delay(60)}
          className="fade-in group/feat block border-b border-[var(--hair)] pb-7 pt-6 outline-none"
        >
          <div className="relative aspect-[2.6/1] overflow-hidden rounded-2xl bg-[var(--stage)] ring-offset-4 ring-offset-[var(--background)] group-focus-visible/feat:ring-2 group-focus-visible/feat:ring-neutral-300">
            <Image
              src={first.cover}
              alt=""
              fill
              quality={92}
              sizes="(min-width: 860px) 760px, 100vw"
              className="object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover/feat:scale-[1.03]"
              style={{ objectPosition: first.coverPosition }}
            />
          </div>
          <div className={`mt-4 flex items-center gap-2.5 text-xs uppercase text-[var(--ink-2)] ${mono}`}>
            <span className="tabular-nums text-[var(--ink)]">01</span>
            <span className="rounded-md bg-[var(--stage)] px-1.5 py-0.5 normal-case text-[var(--ink)]">
              {first.draft ? "Draft" : "Latest"}
            </span>
            <span>{first.tag}</span>
            <span aria-hidden>·</span>
            <span>{first.minutes} min</span>
            <span className="ml-auto">{first.dateLabel}</span>
          </div>
          <h2 className="mt-3 max-w-[640px] font-[family-name:var(--font-grotesk)] text-[26px] font-medium leading-[1.1] tracking-[-0.025em] text-[var(--ink)] sm:text-[34px]">
            {first.title}
          </h2>
          {first.summary && (
            <p className="mt-3 max-w-[600px] text-[15px] leading-[1.55] text-[var(--ink-2)]">{first.summary}</p>
          )}
        </Link>
      )}

      {/* Every other post as a numbered contents line; the arrow slides in on hover. */}
      <ol>
        {rest.map((p, i) => (
          <li key={p.slug} className="fade-in" style={delay(120 + i * 40)}>
            <Link
              href={`/blog/${p.slug}`}
              className="group/row -mx-3 grid grid-cols-[32px_1fr_auto] items-baseline gap-x-4 gap-y-1 rounded-lg border-b border-[var(--hair)] px-3 py-4 outline-none transition-colors duration-200 hover:bg-[var(--stage)] focus-visible:bg-[var(--stage)] sm:grid-cols-[40px_112px_1fr_100px_52px_20px]"
            >
              <span className={`text-[12.5px] tabular-nums text-[var(--ink-2)] transition-colors duration-200 group-hover/row:text-[var(--ink)] ${mono}`}>
                {String(i + 2).padStart(2, "0")}
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
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
