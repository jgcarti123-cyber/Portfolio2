import type { CSSProperties, ReactNode } from "react";

/** Returns a counter that yields increasing animation delays. */
export function stagger(start: number, step = 25) {
  let t = start;
  return () => (t += step);
}

export function delay(ms: number): CSSProperties {
  return { animationDelay: `${ms}ms` };
}

/** Section label followed by a dotted rule, as in "Featured ·········". */
export function SectionLabel({
  children,
  right,
  style,
}: {
  children: ReactNode;
  right?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className="fade-in flex items-center gap-2" style={style}>
      <h2 className="shrink-0 text-xs font-semibold text-neutral-400 dark:text-neutral-600">
        {children}
      </h2>
      <div data-ground={typeof children === "string" ? children : ""} className="flex-1 border-t border-dotted border-neutral-200 dark:border-neutral-800" />
      {right}
    </div>
  );
}

export function Section({
  label,
  start,
  children,
}: {
  label: string;
  start: number;
  children: ReactNode;
}) {
  return (
    <section className="mt-10">
      <SectionLabel style={delay(start)}>{label}</SectionLabel>
      <div className="mt-3 flex flex-col gap-2 desktop:mt-4">{children}</div>
    </section>
  );
}
