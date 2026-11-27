"use client";

import { useEffect, useState } from "react";

// Soft top/bottom fades so content dissolves at the viewport edges. Each steps aside while a photo (the header's
// sky, or the closing band marked data-photo) sits under it, so it doesn't wash the picture out.
export function EdgeFades() {
  const [overTop, setOverTop] = useState(true);
  const [overBottom, setOverBottom] = useState(false);

  useEffect(() => {
    const check = () => {
      const rects = [...document.querySelectorAll(".giant-head, [data-photo]")].map((el) => el.getBoundingClientRect());
      const h = window.innerHeight;
      setOverTop(rects.some((r) => r.top < 64 && r.bottom > 64));
      setOverBottom(rects.some((r) => r.top < h - 80 && r.bottom > h - 80));
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  return (
    <>
      <div
        className="edge-fade pointer-events-none fixed inset-x-0 top-0 z-30 transition-opacity duration-300"
        style={{ opacity: overTop ? 0 : 1 }}
      >
        <div className="bg-background" style={{ height: "env(safe-area-inset-top)" }} />
        <div className="h-16 bg-gradient-to-b from-background to-transparent" />
      </div>
      <div
        className="edge-fade pointer-events-none fixed inset-x-0 bottom-0 z-30 transition-opacity duration-300"
        style={{ paddingBottom: "env(safe-area-inset-bottom)", opacity: overBottom ? 0 : 1 }}
      >
        <div className="h-20 bg-gradient-to-t from-background to-transparent" />
      </div>
    </>
  );
}
