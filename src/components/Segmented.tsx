"use client";

import { useLayoutEffect, useRef, useState } from "react";

export type SegOption = {
  key: string;
  label: string;
  count?: number;
  /** A small square before the label: filled, hollow, or none. */
  mark?: "filled" | "hollow";
  data?: Record<string, string>;
};

/** Grey track with a white pill that slides under the chosen option (radio group semantics). */
export function Segmented({
  options,
  value,
  onChange,
  label,
  className = "",
}: {
  options: SegOption[];
  value: string;
  onChange: (key: string) => void;
  label: string;
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);

  useLayoutEffect(() => {
    const el = track.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(value)}"]`);
    if (!el) return;
    const place = () => setPill({ x: el.offsetLeft, w: el.offsetWidth });
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    return () => ro.disconnect();
  }, [value, options]);

  function onKey(e: React.KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = options.findIndex((o) => o.key === value);
    const next = options[(i + (e.key === "ArrowRight" ? 1 : -1) + options.length) % options.length];
    onChange(next.key);
    track.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(next.key)}"]`)?.focus();
  }

  return (
    <div ref={track} role="radiogroup" aria-label={label} className={`seg ${className}`} onKeyDown={onKey}>
      <span
        className="seg-pill"
        aria-hidden
        style={pill ? { transform: `translateX(${pill.x}px)`, width: pill.w } : { opacity: 0 }}
      />
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            data-key={o.key}
            className="seg-btn"
            onClick={() => onChange(o.key)}
            {...o.data}
          >
            {o.mark && <i className="seg-mark" data-filled={o.mark === "filled" ? "" : undefined} aria-hidden />}
            {o.label}
            {o.count !== undefined && <span className="seg-n">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
