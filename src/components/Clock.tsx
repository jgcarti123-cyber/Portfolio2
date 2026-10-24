"use client";

import { useEffect, useState } from "react";

function format(timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone,
  }).format(new Date());
}

/** Live local time for the owner's city; each digit blurs in as it changes. */
export function Clock({ timeZone }: { timeZone: string }) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTime(format(timeZone));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timeZone]);

  return (
    <span
      data-ground="clock"
      className="text-sm text-neutral-400 tabular-nums dark:text-neutral-600"
      aria-label={time ? `Local time ${time}` : undefined}
      title={`Local time · ${timeZone.replace("_", " ")}`}
    >
      {time ? (
        time.split("").map((ch, i) =>
          /\d/.test(ch) ? (
            <span key={`${i}-${ch}`} className="blur-in inline-block w-[1ch] text-center">
              {ch}
            </span>
          ) : (
            <span key={i} className="inline-block whitespace-pre">
              {ch}
            </span>
          ),
        )
      ) : (
        <span className="opacity-0">00:00:00 AM</span>
      )}
    </span>
  );
}
