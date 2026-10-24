"use client";

import { useMemo, useState } from "react";

export type Day = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };

type Range = 30 | 60 | 90 | "all";

const RANGES: { value: Range; label: string }[] = [
  { value: 30, label: "30d" },
  { value: 60, label: "60d" },
  { value: 90, label: "90d" },
  { value: "all", label: "All" },
];

const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  toDate(iso).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });

const plural = (n: number) =>
  n === 0 ? "No contributions" : `${n.toLocaleString()} contribution${n === 1 ? "" : "s"}`;

const cellColor = (level: Day["level"]) => ({ background: `var(--contrib-${level})` });

/** Days covered by a range. "All" starts at the first contribution. */
function select(days: Day[], range: Range): Day[] {
  if (range !== "all") return days.slice(-range);
  const first = days.findIndex((d) => d.count > 0);
  return first === -1 ? days.slice(-30) : days.slice(first);
}

/** Lays days out GitHub-style: one column per week (Sun → Sat), padded at both ends. */
function toWeeks(days: Day[]) {
  const weeks: (Day | null)[][] = [];
  let week: (Day | null)[] = Array(toDate(days[0].date).getUTCDay()).fill(null);
  for (const d of days) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push([...week, ...Array(7 - week.length).fill(null)]);

  // Month label above the first column that contains the 1st (or the first column),
  // skipped when too close to the previous label to fit.
  let lastLabel = -2;
  const months = weeks.map((w, i) => {
    const firstOfMonth = w.find((d) => d && (i === 0 || d.date.endsWith("-01")));
    if (!firstOfMonth || i - lastLabel < 2) return null;
    lastLabel = i;
    return fmt(firstOfMonth.date, { month: "short" });
  });
  return { weeks, months };
}

function Bars({
  days,
  hover,
  onHover,
}: {
  days: Day[];
  hover: string | null;
  onHover: (d: Day | null) => void;
}) {
  return (
    <div className="flex h-5 items-stretch gap-[3px]" onMouseLeave={() => onHover(null)}>
      {days.map((d) => (
        <span
          key={d.date}
          onMouseEnter={() => onHover(d)}
          className="flex-1 rounded-[3px] transition-[transform,opacity] duration-150"
          style={{
            ...cellColor(d.level),
            transform: hover === d.date ? "scaleY(1.15)" : undefined,
            opacity: hover && hover !== d.date ? 0.55 : 1,
          }}
        />
      ))}
    </div>
  );
}

function Heatmap({
  days,
  hover,
  onHover,
}: {
  days: Day[];
  hover: string | null;
  onHover: (d: Day | null) => void;
}) {
  const { weeks, months } = useMemo(() => toWeeks(days), [days]);
  // Squares top out at 16px and shrink to fit long histories.
  const columns = { gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 16px))` };

  return (
    <div onMouseLeave={() => onHover(null)}>
      <div className="mb-1.5 grid gap-[3px]" style={columns} aria-hidden>
        {months.map((m, i) => (
          <span key={i} className="h-4 overflow-visible whitespace-nowrap text-[11px] leading-4 text-neutral-400 dark:text-neutral-600">
            {m}
          </span>
        ))}
      </div>
      <div className="grid grid-flow-col grid-rows-7 gap-[3px]" style={columns}>
        {weeks.flatMap((w, wi) =>
          w.map((d, di) =>
            d ? (
              <span
                key={d.date}
                onMouseEnter={() => onHover(d)}
                className="aspect-square rounded-[3px] transition-[opacity,box-shadow] duration-150"
                style={{
                  ...cellColor(d.level),
                  opacity: hover && hover !== d.date ? 0.6 : 1,
                  boxShadow: hover === d.date ? "0 0 0 1.5px var(--foreground)" : undefined,
                }}
              />
            ) : (
              <span key={`pad-${wi}-${di}`} className="aspect-square" />
            ),
          ),
        )}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-1 text-[11px] text-neutral-400 dark:text-neutral-600" aria-hidden>
      Less
      {([0, 1, 2, 3, 4] as const).map((l) => (
        <span key={l} className="size-2.5 rounded-[2px]" style={cellColor(l)} />
      ))}
      More
    </div>
  );
}

/** 30 days as bars; longer ranges as a GitHub-style calendar so the whole pattern reads at a glance. */
export function ContributionBars({ days, username }: { days: Day[] | null; username: string }) {
  const [range, setRange] = useState<Range>(30);
  const [hover, setHover] = useState<Day | null>(null);

  const shown = useMemo(() => (days?.length ? select(days, range) : null), [days, range]);
  const total = shown?.reduce((s, d) => s + d.count, 0);

  function choose(r: Range) {
    if (r === range) return;
    setRange(r);
    setHover(null);
  }

  const summary =
    total === undefined || !shown
      ? "GitHub"
      : range === "all"
        ? `${total.toLocaleString()} since ${fmt(shown[0].date, { month: "short", year: "numeric" })}`
        : plural(total);

  return (
    <div data-ground className="mt-5">
      <div key={range} className="blur-in" role="img" aria-label={`${summary} on GitHub`}>
        {!shown ? (
          <div className="flex h-5 gap-[3px]">
            {Array.from({ length: 30 }, (_, i) => (
              <span key={i} className="flex-1 rounded-[3px]" style={cellColor(0)} />
            ))}
          </div>
        ) : range === 30 ? (
          <Bars days={shown} hover={hover?.date ?? null} onHover={setHover} />
        ) : (
          <Heatmap days={shown} hover={hover?.date ?? null} onHover={setHover} />
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-xs">
        <div className="-ml-1.5 flex items-center" role="group" aria-label="Contribution range">
          {RANGES.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => choose(r.value)}
              aria-pressed={range === r.value}
              className={`cursor-pointer rounded-md px-1.5 py-0.5 tabular-nums transition-colors duration-150 ${
                range === r.value
                  ? "bg-neutral-100 font-medium text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                  : "text-neutral-400 hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-400"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {hover ? (
          <span key={hover.date} className="blur-in truncate tabular-nums text-neutral-400 dark:text-neutral-600">
            <span className="text-neutral-600 dark:text-neutral-400">
              {fmt(hover.date, { month: "short", day: "numeric" })}
            </span>{" "}
            · {plural(hover.count)}
          </span>
        ) : (
          <a
            key={`${range}-total`}
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noreferrer"
            className="blur-in truncate tabular-nums text-neutral-400 transition-colors hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-400"
          >
            {summary}
          </a>
        )}
      </div>

      {range !== 30 && shown && (
        <div className="blur-in mt-2 flex justify-end">
          <Legend />
        </div>
      )}
    </div>
  );
}
