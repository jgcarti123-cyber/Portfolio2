"use client";

import { useEffect, useState } from "react";

/** Cycles through short phrases with a blur crossfade. */
export function RotatingText({
  items,
  interval = 3200,
}: {
  items: string[];
  interval?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), interval);
    return () => clearInterval(id);
  }, [items.length, interval]);

  return (
    <span className="relative block h-5" aria-label={items.join(", ")}>
      <span key={index} className="blur-in absolute left-0 top-0 whitespace-nowrap" aria-hidden>
        {items[index]}
      </span>
    </span>
  );
}
