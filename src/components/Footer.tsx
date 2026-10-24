"use client";

import { Moon, Sun } from "@phosphor-icons/react/dist/ssr";
import { profile } from "@/data/site";
import { useHydrated } from "@/lib/hooks";

const sha = (process.env.NEXT_PUBLIC_COMMIT_SHA ?? "dev").slice(0, 7).toUpperCase();

export function Footer({ style }: { style?: React.CSSProperties }) {
  const hydrated = useHydrated();
  const hour = hydrated
    ? Number(
        new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: profile.timeZone }).format(
          new Date(),
        ),
      )
    : null;
  const day = hour === null ? null : hour >= 6 && hour < 18;

  return (
    <footer
      data-ground
      className="fade-in mt-16 flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-600"
      style={style}
    >
      <span>
        JG © {new Date().getFullYear()} ·{" "}
        <span className="font-mono tracking-tight underline decoration-dotted underline-offset-[3px]" title="Build">
          {sha}
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        {day === null ? null : day ? (
          <Sun size={13} weight="fill" className="text-amber-400" />
        ) : (
          <Moon size={13} weight="fill" className="text-indigo-300" />
        )}
        {profile.location}
      </span>
    </footer>
  );
}
