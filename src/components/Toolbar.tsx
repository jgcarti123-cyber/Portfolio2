"use client";

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BigTabs } from "./BigTabs";
import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react/dist/ssr";
import { featured, work } from "@/data/site";
import { shelf } from "@/data/shelf";
import { skillGroups } from "@/data/skills";
import { playTick, setSoundEnabled, useSoundEnabled } from "@/lib/sound";

export type ActivePage = "home" | "skills" | "shelf" | "blog";

const pages = [
  { page: "home", href: "/", label: "Home" },
  { page: "shelf", href: "/shelf", label: "Shelf" },
  { page: "skills", href: "/skills", label: "Skills" },
  { page: "blog", href: "/blog", label: "Blog" },
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

function useActivePage(): ActivePage {
  const pathname = usePathname();
  return pages.find((p) => p.href !== "/" && pathname.startsWith(p.href))?.page ?? "home";
}

/**
 * Going to another page: the header stays, the page under it softens and lifts away, then the next one settles in
 * with its own staggered entrance. Returns a click handler for any element holding page links, which says whether it
 * set off a page change.
 */
function usePageLeave() {
  const pathname = usePathname();
  const router = useRouter();
  const leaving = useRef<Animation | null>(null);

  // The new page has arrived: drop whatever is left of the old one's exit.
  useEffect(() => {
    leaving.current?.cancel();
    leaving.current = null;
  }, [pathname]);

  return function onNavigate(e: MouseEvent<HTMLElement>): boolean {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    const href = a.getAttribute("href")!;
    if (!href.startsWith("/")) return false;
    const main = document.querySelector<HTMLElement>("#site main");
    if (href === pathname || leaving.current) {
      e.preventDefault();
      return false;
    }
    if (!main || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
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
    return true;
  };
}

type Spot = { x: number; y: number; size: number; spacing: string; color: string; shadow: string; comma: boolean };

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const DURATION = 680;

/** Where each word sits (relative to the row) and how it is drawn, so a page change can start from there. */
function measure(row: HTMLElement) {
  const base = row.getBoundingClientRect();
  return new Map<string, Spot>(
    [...row.querySelectorAll<HTMLElement>("li[data-key]")].map((li) => {
      const word = li.firstElementChild as HTMLElement;
      const r = word.getBoundingClientRect();
      const css = getComputedStyle(li);
      const comma = li.querySelector(".bt-comma");
      return [
        li.dataset.key!,
        {
          x: r.left - base.left,
          y: r.top - base.top,
          size: parseFloat(css.fontSize),
          spacing: css.letterSpacing,
          color: getComputedStyle(word).color,
          shadow: css.textShadow,
          comma: !!comma && getComputedStyle(comma).display !== "none",
        },
      ];
    }),
  );
}

/**
 * Moving between pages. Every word glides from where it was to where it now sits, all on one curve. The new page's
 * word grows from its small size; text is only ever scaled down from its drawn size, so it stays sharp. The old
 * big word can't grow back the same way (scaling the small word up would blur it), so a full-size copy shrinks into
 * its new place and hands over to the real word as it lands.
 */
function play(row: HTMLElement, before: Map<string, Spot>, after: Map<string, Spot>) {
  const timing = { duration: DURATION, easing: EASE };
  for (const li of row.querySelectorAll<HTMLElement>("li[data-key]")) {
    const a = before.get(li.dataset.key!);
    const b = after.get(li.dataset.key!);
    const word = li.firstElementChild as HTMLElement;
    if (!a || !b || (a.x === b.x && a.y === b.y && a.size === b.size)) continue;
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    if (a.size === b.size) {
      // A small word making room: it only slides.
      word.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], timing);
    } else if (a.size < b.size) {
      // The new page's word: grows from its small place, brightening as it goes; its count arrives as it settles.
      word.animate(
        [
          { transformOrigin: "0 0", transform: `translate(${dx}px, ${dy}px) scale(${a.size / b.size})`, color: a.color },
          { transformOrigin: "0 0", transform: "none", color: b.color },
        ],
        timing,
      );
      word.querySelector(".bt-n")?.animate([{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }], timing);
    } else {
      // The old page's word: a copy drawn at the old size shrinks into the new place and fades as the real
      // (small) word fades in under it.
      const ghost = document.createElement("span");
      ghost.setAttribute("aria-hidden", "");
      ghost.className = "bt-ghost";
      Object.assign(ghost.style, {
        left: `${a.x}px`,
        top: `${a.y}px`,
        fontSize: `${a.size}px`,
        letterSpacing: a.spacing,
        color: a.color,
        textShadow: a.shadow,
      });
      const copy = word.cloneNode(true) as HTMLElement;
      copy.removeAttribute("href");
      copy.querySelector<HTMLElement>(".bt-comma")?.style.setProperty("display", a.comma ? "inline" : "none");
      ghost.append(copy);
      row.append(ghost);
      // Phones move the old word down a line, under the one growing in its place, so it fades out sooner there.
      const out = Math.abs(dy) > 4 ? 0.4 : 0.85;
      ghost
        .animate(
          [
            { transformOrigin: "0 0", transform: "none", opacity: 1 },
            { opacity: out < 0.5 ? 0 : 1, offset: out < 0.5 ? out : 0.6 },
            { transformOrigin: "0 0", transform: `translate(${-dx}px, ${-dy}px) scale(${b.size / a.size})`, opacity: 0 },
          ],
          timing,
        )
        .finished.then(() => ghost.remove(), () => ghost.remove());
      word.animate([{ opacity: 0 }, { opacity: 0, offset: out < 0.5 ? 0.45 : 0.6 }, { opacity: 1 }], timing);
    }
  }
}

/**
 * The pages as huge words with counts (after things.bharadwhat.com): the current page full size and the others
 * small beside it, so every page is in view. Clicking another page moves the words at once, while the page under
 * the header lifts away.
 */
export function Toolbar({ blogCount }: { blogCount: number }) {
  const current = useActivePage();
  const onNavigate = usePageLeave();
  const pathname = usePathname();
  // The page being opened, so the words move on the click rather than after the old page has left.
  const [opening, setOpening] = useState<{ from: string; page: ActivePage } | null>(null);
  // Once the new page has arrived (or the address changed some other way, like Back), the address says it all.
  if (opening && opening.from !== pathname) setOpening(null);
  const active = opening && opening.from === pathname ? opening.page : current;

  const nav = useRef<HTMLElement>(null);
  const spots = useRef(new Map<string, Spot>());
  useLayoutEffect(() => {
    const row = nav.current?.querySelector<HTMLElement>(".giant-tabs");
    if (!row) return;
    // Settle anything still moving from a previous click before measuring.
    row.querySelectorAll(".bt-ghost").forEach((g) => g.remove());
    row.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    const before = spots.current;
    spots.current = measure(row);
    if (before.size && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) play(row, before, spots.current);
    const remeasure = () => (spots.current = measure(row));
    window.addEventListener("resize", remeasure);
    document.fonts?.ready.then(remeasure);
    return () => window.removeEventListener("resize", remeasure);
  }, [active]);

  return (
    <nav
      ref={nav}
      aria-label="Site"
      onClickCapture={(e) => {
        // Capture runs before the Link's own click, so the page can leave first (see usePageLeave).
        if (!onNavigate(e)) return;
        const href = (e.target as HTMLElement).closest("a[href]")?.getAttribute("href");
        const page = pages.find((p) => p.href === href)?.page;
        if (page) setOpening({ from: pathname, page });
      }}
    >
      <BigTabs
        label="Pages"
        size="clamp(64px, 13vw, 260px)"
        className="giant-tabs"
        spotlight
        scroll={false}
        active={active}
        items={pages.map(({ page, href, label }) => ({ key: page, label, href, count: page === "blog" ? blogCount : counts[page] }))}
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
