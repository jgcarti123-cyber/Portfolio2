"use client";

import { useEffect, useState, type CSSProperties } from "react";

/**
 * Cycles through short phrases like a split-flap roll: the old word's letters roll up and out while the new
 * word's letters roll up into place, one just after another.
 */
export function RotatingText({
  items,
  interval = 1900,
  className = "h-5",
}: {
  items: string[];
  interval?: number;
  /** Sets the line height of the box; defaults to a 20px line. */
  className?: string;
}) {
  const [{ index, prev }, setState] = useState<{ index: number; prev: number | null }>({ index: 0, prev: null });

  useEffect(() => {
    if (items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setState((s) => ({ index: (s.index + 1) % items.length, prev: s.index })), interval);
    return () => clearInterval(id);
  }, [items.length, interval]);

  const word = (text: string, dir: "in" | "out" | "still", key: string) => (
    <span key={key} className="roll-word absolute left-0 top-0 whitespace-nowrap" aria-hidden>
      {[...text].map((ch, i) => (
        <span key={i} className="roll-clip">
          <span className={`roll-ch roll-${dir}`} style={{ "--i": i } as CSSProperties}>
            {ch === " " ? " " : ch}
          </span>
        </span>
      ))}
    </span>
  );

  return (
    <span className={`relative block ${className}`} aria-label={items.join(", ")}>
      {prev !== null && word(items[prev], "out", `o${prev}-${index}`)}
      {word(items[index], prev === null ? "still" : "in", `i${index}`)}
    </span>
  );
}
