"use client";

import Link from "next/link";
import {
  Files,
  House,
  Moon,
  SpeakerHigh,
  SpeakerSlash,
  Stack,
  Sun,
} from "@phosphor-icons/react/dist/ssr";
import { useIsDark } from "@/lib/hooks";
import { playTick, setSoundEnabled, useSoundEnabled } from "@/lib/sound";

export type ActivePage = "home" | "skills" | "shelf";

const pages = [
  { page: "home", href: "/", label: "Home", Icon: House },
  { page: "shelf", href: "/shelf", label: "Shelf", Icon: Stack },
  { page: "skills", href: "/skills", label: "Skills", Icon: Files },
] as const;

const base =
  "relative flex items-center justify-center size-6 -m-1 rounded-md transition-colors duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700";
const idle =
  "text-neutral-400 hover:text-neutral-700 dark:text-neutral-600 dark:hover:text-neutral-300";
const on = "text-neutral-800 dark:text-neutral-200";

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

export function Toolbar({ active }: { active: ActivePage }) {
  const sound = useSoundEnabled();
  const dark = useIsDark();

  function toggleTheme() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  function toggleSound() {
    setSoundEnabled(!sound);
    if (!sound) setTimeout(() => playTick(0.9), 0);
  }

  return (
    <nav aria-label="Site" className="flex items-center gap-4">
      {pages.map(({ page, href, label, Icon }) => (
        <Link
          key={page}
          href={href}
          className={`group/tip ${base} ${active === page ? on : idle}`}
          aria-label={label}
          aria-current={active === page ? "page" : undefined}
        >
          <Icon size={16} weight={active === page ? "fill" : "bold"} />
          <Tip label={label} />
        </Link>
      ))}
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
      <button
        type="button"
        onClick={toggleTheme}
        className={`group/tip ${base} ${idle}`}
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {dark ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
        <Tip label={dark ? "Light" : "Dark"} />
      </button>
    </nav>
  );
}
