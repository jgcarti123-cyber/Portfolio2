"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

export type BigTab = {
  key: string;
  label: string;
  count?: number;
  /** A link instead of a button (site navigation). */
  href?: string;
  /** Extra attributes J looks for, e.g. data-slug on the Shelf. */
  data?: Record<string, string>;
};

/** The word itself, with a spectrum copy on top that sweeps across on hover. */
function Word({ children }: { children: ReactNode }) {
  return (
    <span className="bt-hl">
      <span>{children}</span>
      <span className="bt-grad" aria-hidden>
        {children}
      </span>
    </span>
  );
}

/**
 * A run of big comma-separated words with superscript counts, after things.bharadwhat.com. Used for the site
 * navigation (links) and for in-page filters (buttons).
 */
export function BigTabs({
  items,
  active,
  onSelect,
  label,
  size,
  scroll = true,
  className = "",
  style,
  ground,
  spotlight = false,
}: {
  items: BigTab[];
  active: string;
  onSelect?: (key: string) => void;
  label: string;
  /** CSS font-size; defaults to the large size. */
  size?: string;
  /** On phones, keep the words on one line that scrolls sideways. */
  scroll?: boolean;
  className?: string;
  style?: CSSProperties;
  /** data-ground value, so J can stand on the row. */
  ground?: string;
  /** The current word full size and the rest small beside it, so every word stays in view (the site pages). */
  spotlight?: boolean;
}) {
  return (
    <ul
      className={`bt ${spotlight ? "bt-spot" : ""} ${className}`}
      data-scroll={scroll ? "" : undefined}
      style={{ ...(size ? ({ "--bt-size": size } as CSSProperties) : null), ...style }}
      aria-label={label}
      data-ground={ground}
    >
      {items.map((t, i) => {
        const on = t.key === active;
        const comma = i < items.length - 1;
        // In a spotlight row only the big word keeps its comma, and only while the words share a line.
        const text = spotlight ? (
          <>
            {t.label}
            {comma && <span className="bt-comma">,</span>}
          </>
        ) : (
          `${t.label}${comma ? "," : ""}`
        );
        const common = {
          className: "bt-item",
          "data-active": on ? "" : undefined,
          "data-empty": t.count === 0 ? "" : undefined,
          ...t.data,
        };
        const inner = (
          <>
            <Word>{text}</Word>
            {t.count !== undefined && <sup className="bt-n">{t.count}</sup>}
          </>
        );
        return (
          <li key={t.key} data-key={t.key} data-on={on ? "" : undefined}>
            {t.href ? (
              <Link href={t.href} aria-current={on ? "page" : undefined} {...common}>
                {inner}
              </Link>
            ) : (
              <button
                type="button"
                aria-pressed={on}
                onClick={() => {
                  if (!on) onSelect?.(t.key);
                }}
                {...common}
              >
                {inner}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
