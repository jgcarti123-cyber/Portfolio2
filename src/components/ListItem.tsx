import type { ReactNode } from "react";

/** Layout for a non-interactive row. */
export const staticRowClass =
  "group flex w-[calc(100%+1.5rem)] items-center gap-4 rounded-lg py-1.5 pl-3 pr-4 -mx-3 text-left";

/** Layout + hover/press feedback for a clickable row. */
export const rowClass = `${staticRowClass} transition-all duration-150 outline-none hover:bg-neutral-100 focus-visible:bg-neutral-100 active:scale-[0.98] dark:hover:bg-neutral-900 dark:focus-visible:bg-neutral-900`;

/** Icon tile + title/subtitle (+ optional right-aligned meta). Wrap in a link or button. */
export function ListItemBody({
  icon,
  title,
  subtitle,
  meta,
}: {
  icon: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-neutral-50 text-neutral-700 transition-colors duration-150 group-hover:bg-white dark:bg-neutral-900 dark:text-neutral-300 dark:group-hover:bg-neutral-800">
        <span className="transition-transform duration-150 group-hover:scale-110">{icon}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium leading-5 text-foreground">{title}</span>
        <span className="block truncate text-sm leading-5 text-neutral-500 dark:text-neutral-400">
          {subtitle}
        </span>
      </span>
      {meta && (
        <span className="shrink-0 self-start pt-0.5 text-xs tabular-nums leading-5 text-neutral-400 dark:text-neutral-600">
          {meta}
        </span>
      )}
    </>
  );
}
