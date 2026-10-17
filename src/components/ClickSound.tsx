"use client";

import { useEffect } from "react";
import { playTick } from "@/lib/sound";

/** Plays a soft tick on every click or tap, anywhere on the page. */
export function ClickSound() {
  useEffect(() => {
    // Capture phase so it still fires if a component stops propagation.
    // `click` (not pointerdown) so scrolling on touch screens stays silent.
    // Controls with their own sound (like the pull cord) opt out with data-no-tick.
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.("[data-no-tick]")) return;
      playTick(0.9);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
