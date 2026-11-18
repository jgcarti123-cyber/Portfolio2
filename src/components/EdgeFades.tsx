"use client";

import { useEffect, useState } from "react";

// Soft top/bottom fades so content dissolves at the viewport edges. The top one steps aside while the header
// photo is on screen, so it doesn't wash out the sky.
export function EdgeFades() {
  const [overHeader, setOverHeader] = useState(true);

  useEffect(() => {
    const check = () => {
      const head = document.querySelector(".giant-head");
      setOverHeader(!!head && head.getBoundingClientRect().bottom > 64);
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
        className="pointer-events-none fixed inset-x-0 top-0 z-30 transition-opacity duration-300"
        style={{ opacity: overHeader ? 0 : 1 }}
      >
        <div className="bg-background" style={{ height: "env(safe-area-inset-top)" }} />
        <div className="h-16 bg-gradient-to-b from-background to-transparent" />
      </div>
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="h-20 bg-gradient-to-t from-background to-transparent" />
      </div>
    </>
  );
}
