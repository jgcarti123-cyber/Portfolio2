"use client";

import { useC4Status } from "@/lib/c4-status";

/** A small green dot beside John's name while he's online and can take a game. */
export function OnlineDot() {
  const { live, online } = useC4Status();
  if (!live || !online) return null;
  return (
    <span
      className="relative ml-1.5 inline-flex size-1.5 align-middle"
      role="img"
      aria-label="John is online"
      title="John is online. Challenge him to Connect 4"
    >
      <span className="absolute inset-0 rounded-full bg-[#2da44e] opacity-50 motion-safe:animate-ping" />
      <span className="relative size-1.5 rounded-full bg-[#2da44e]" />
    </span>
  );
}
