import type { ReactNode } from "react";

export const inlineLink =
  "font-medium text-neutral-800 underline decoration-neutral-300 decoration-dotted underline-offset-[3px] transition-colors duration-100 hover:text-neutral-500 dark:text-neutral-200 dark:decoration-neutral-600 dark:hover:text-neutral-400";

export function InlineLink({ href, children }: { href: string; children: ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className={inlineLink}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
