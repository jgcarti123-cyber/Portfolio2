"use client";

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { onBulbHit, tellMascot } from "@/lib/mascot";
import { useIsDark } from "@/lib/hooks";
import { playSwitch } from "@/lib/sound";

const MAX_PULL = 44; // how far the cord stretches, in px
const TRIGGER = 14; // a pull past this flips the lights on release
const TAP_PULL = 18; // a tap or key press tugs it this far
const FLICKER_MS = 560; // matches the theme-flicker animations in globals.css
const SWAP_AT = 0.68; // the moment in the flicker when the overlay fully covers the page

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem("theme", dark ? "dark" : "light");
  } catch {}
}

/**
 * A light-switch pull cord hanging from the top-right of the window. Pull it (or tap it, or press Enter
 * on it) and the lights flicker off into dark mode, or flicker back on like a warming tube.
 */
export function PullCord() {
  const dark = useIsDark();
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [swings, setSwings] = useState(0);
  const [flicker, setFlicker] = useState<"dark" | "light" | null>(null);
  const drag = useRef<{ y: number; moved: number; pull: number } | null>(
    null,
  );
  const busy = useRef(false);

  function flip() {
    if (busy.current) return;
    const toDark = !document.documentElement.classList.contains("dark");
    playSwitch(toDark);
    tellMascot({ type: "cord", dark: toDark });
    setSwings((n) => n + 1);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      applyTheme(toDark);
      return;
    }
    // A full-screen layer in the new background flickers in, the theme swaps underneath it, and it fades away.
    busy.current = true;
    setFlicker(toDark ? "dark" : "light");
    setTimeout(() => applyTheme(toDark), FLICKER_MS * SWAP_AT);
    setTimeout(() => {
      setFlicker(null);
      busy.current = false;
    }, FLICKER_MS + 40);
  }

  // J kicking the ball into the bulb works like a tug.
  const onBulb = useEffectEvent(() => tug());
  useEffect(() => onBulbHit(onBulb), []);

  function tug() {
    setPull(TAP_PULL);
    setTimeout(() => setPull(0), 110);
    flip();
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    drag.current = { y: e.clientY, moved: 0, pull: 0 };
    setDragging(true);
  }

  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.y;
    d.moved = Math.max(d.moved, Math.abs(dy));
    // Rubber band: easy at first, stiffer towards the end of the stretch.
    d.pull = dy <= 0 ? 0 : MAX_PULL * (1 - Math.exp(-dy / MAX_PULL));
    setPull(d.pull);
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (!d) return;
    if (d.moved < 4) return tug();
    setPull(0);
    if (d.pull >= TRIGGER) flip();
  }

  function onPointerCancel() {
    drag.current = null;
    setDragging(false);
    setPull(0);
  }

  // Pointer pulls are handled above; this is for Enter and Space.
  function onClick(e: MouseEvent<HTMLButtonElement>) {
    if (e.detail === 0) tug();
  }

  return (
    <>
      <div
        className="group/cord fixed top-0 right-5 z-50 [--len:34px] sm:right-10 sm:[--len:56px]"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div
          className={`flex origin-top flex-col items-center ${
            swings === 0 ? "" : swings % 2 ? "cord-swing-a" : "cord-swing-b"
          }`}
        >
          <span
            className="w-px bg-neutral-300 dark:bg-neutral-700"
            style={{
              height: `calc(var(--len) + ${pull}px)`,
              transition: dragging
                ? "none"
                : "height 480ms cubic-bezier(0.34, 1.7, 0.5, 1)",
            }}
          />
          <button
            type="button"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onClick={onClick}
            data-no-tick
            aria-label={
              dark
                ? "Turn the lights on (light mode)"
                : "Turn the lights off (dark mode)"
            }
            className="group/bead -mx-3 -mt-px -mb-3 cursor-grab touch-none rounded-full px-3 pt-px pb-3 outline-none select-none active:cursor-grabbing"
          >
            {/* The bulb: warm in both themes, with a soft breathing halo that swells while you reach for it. */}
            <span className="relative block">
              <span
                aria-hidden
                className={`cord-halo pointer-events-none absolute top-1/2 left-1/2 size-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(255_196_92/0.55)_0%,rgb(255_170_40/0.22)_38%,transparent_70%)] transition-[opacity,scale] duration-300 dark:bg-[radial-gradient(circle,rgb(255_196_92/0.7)_0%,rgb(255_160_30/0.3)_38%,transparent_70%)] ${
                  dragging
                    ? "scale-150 opacity-100"
                    : "opacity-70 group-hover/cord:scale-125 group-hover/cord:opacity-100 dark:opacity-90"
                }`}
              />
              <span
                className={`relative block h-4 w-2.5 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff6d8_0%,#ffcf5c_55%,#e09a00_100%)] shadow-[0_0_6px_rgb(255_184_0/0.45)] ring-neutral-400 ring-offset-background transition-[box-shadow,scale] duration-300 group-focus-visible/bead:ring-2 group-focus-visible/bead:ring-offset-2 dark:shadow-[0_0_10px_rgb(255_184_0/0.6)] ${
                  dragging ? "scale-110" : ""
                }`}
              />
            </span>
          </button>
        </div>
        <span
          aria-hidden
          className="pointer-events-none absolute top-[calc(env(safe-area-inset-top)+var(--len)+2px)] right-full mr-1 hidden translate-x-1 whitespace-nowrap text-[11px] text-neutral-400 opacity-0 transition-all duration-200 group-hover/cord:translate-x-0 group-hover/cord:opacity-100 sm:block dark:text-neutral-600"
        >
          {dark ? "Lights on" : "Lights off"}
        </span>
      </div>

      {flicker && (
        <div
          aria-hidden
          className={`pointer-events-none fixed inset-0 z-[100] ${
            flicker === "dark"
              ? "theme-flicker-dark bg-[#0a0a0a]"
              : "theme-flicker-light bg-white"
          }`}
          style={{ animationDuration: `${FLICKER_MS}ms` }}
        />
      )}
    </>
  );
}
