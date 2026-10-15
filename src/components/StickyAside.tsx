"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Sticky column that never hides its own bottom: when it is taller than the window,
 * it sticks with its bottom edge in view instead of its top.
 */
export function StickyAside({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      el.style.top = `${Math.min(48, window.innerHeight - el.offsetHeight - 24)}px`;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div ref={ref} className={`sticky top-12 ${className}`}>
      {children}
    </div>
  );
}
