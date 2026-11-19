"use client";

import { useEffect, useRef, type MouseEvent, type PointerEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BigTabs } from "./BigTabs";
import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react/dist/ssr";
import { featured, work } from "@/data/site";
import { shelf } from "@/data/shelf";
import { skillGroups } from "@/data/skills";
import { playTick, setSoundEnabled, useSoundEnabled } from "@/lib/sound";

export type ActivePage = "home" | "skills" | "shelf";

const pages = [
  { page: "home", href: "/", label: "Home" },
  { page: "shelf", href: "/shelf", label: "Shelf" },
  { page: "skills", href: "/skills", label: "Skills" },
] as const;

const base =
  "relative flex items-center justify-center size-6 -m-1 rounded-md transition-colors duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700";
const idle =
  "text-neutral-400 hover:text-neutral-700 dark:text-neutral-600 dark:hover:text-neutral-300";

function Tip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600 opacity-0 transition-all duration-150 group-hover/tip:translate-y-0 group-hover/tip:opacity-100 group-focus-visible/tip:translate-y-0 group-focus-visible/tip:opacity-100 dark:bg-neutral-800 dark:text-neutral-300"
    >
      {label}
      <span className="absolute left-1/2 top-full size-0 -translate-x-1/2 border-x-[5px] border-t-[5px] border-x-transparent border-t-neutral-100 dark:border-t-neutral-800" />
    </span>
  );
}

const counts = {
  home: new Set([...featured, ...work].map((p) => p.slug)).size,
  shelf: shelf.reduce((n, l) => n + l.links.length, 0),
  skills: skillGroups.reduce((n, g) => n + g.skills.length, 0),
};

/**
 * The pages as huge words with counts (after things.bharadwhat.com), sized to run off the right edge of the
 * window on wide screens. On phones the row scrolls sideways instead.
 */
export function Toolbar() {
  const pathname = usePathname();
  const router = useRouter();
  const active: ActivePage = pages.find((p) => p.href !== "/" && pathname.startsWith(p.href))?.page ?? "home";
  const leaving = useRef<Animation | null>(null);

  // The new page has arrived: drop whatever is left of the old one's exit.
  useEffect(() => {
    leaving.current?.cancel();
    leaving.current = null;
  }, [pathname]);

  // Going to another page: the header stays, the page under it softens and lifts away, then the next one
  // settles in with its own staggered entrance.
  function onNavigate(e: MouseEvent<HTMLElement>) {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const href = a.getAttribute("href")!;
    const main = document.querySelector<HTMLElement>("#site main");
    if (href === pathname || leaving.current) return e.preventDefault();
    if (!main || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    e.preventDefault();
    router.prefetch(href);
    leaving.current = main.animate(
      [
        { opacity: 1, filter: "blur(0px)", transform: "none" },
        { opacity: 0, filter: "blur(6px)", transform: "translateY(-8px)" },
      ],
      { duration: 240, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" },
    );
    // Navigate when the exit ends, or after a beat anyway if the browser holds animations back (a hidden tab).
    let gone = false;
    const go = () => {
      if (gone) return;
      gone = true;
      router.push(href);
    };
    leaving.current.onfinish = go;
    setTimeout(go, 320);
  }

  // Mouse users can drag the row sideways; trackpads and touch scroll it natively. A drag never counts as a click.
  const drag = useRef<{ x: number; left: number; moved: boolean; row: HTMLElement } | null>(null);
  const dragged = useRef(false);

  function onPointerDown(e: PointerEvent<HTMLElement>) {
    const row = e.currentTarget.querySelector<HTMLElement>(".giant-tabs");
    if (e.pointerType !== "mouse" || e.button !== 0 || !row || row.scrollWidth <= row.clientWidth) return;
    drag.current = { x: e.clientX, left: row.scrollLeft, moved: false, row };
    dragged.current = false;
  }
  function onPointerMove(e: PointerEvent<HTMLElement>) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      d.row.setAttribute("data-dragging", "");
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (d.moved) d.row.scrollLeft = d.left - dx;
  }
  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    dragged.current = d.moved;
    d.row.removeAttribute("data-dragging");
  }

  return (
    <nav
      aria-label="Site"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDragStart={(e) => e.preventDefault()}
      onClickCapture={(e) => {
        // Capture runs before the Link's own click, so preventing here stops its instant navigation.
        if (!dragged.current) return onNavigate(e);
        dragged.current = false;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <BigTabs
        label="Pages"
        size="clamp(64px, 13vw, 260px)"
        className="giant-tabs"
        active={active}
        items={pages.map(({ page, href, label }) => ({ key: page, label, href, count: counts[page] }))}
      />
    </nav>
  );
}

export function SoundToggle() {
  const sound = useSoundEnabled();

  function toggleSound() {
    setSoundEnabled(!sound);
    if (!sound) setTimeout(() => playTick(0.9), 0);
  }

  return (
    <button
      type="button"
      onClick={toggleSound}
      className={`group/tip ${base} ${idle}`}
      aria-label={sound ? "Mute sounds" : "Unmute sounds"}
      aria-pressed={sound}
    >
      {sound ? <SpeakerHigh size={16} weight="bold" /> : <SpeakerSlash size={16} weight="bold" />}
      <Tip label={sound ? "Sound on" : "Sound off"} />
    </button>
  );
}
