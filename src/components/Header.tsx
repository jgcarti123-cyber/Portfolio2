import Link from "next/link";
import { profile } from "@/data/site";
import { Clock } from "./Clock";
import { RotatingText } from "./RotatingText";
import { Toolbar, type ActivePage } from "./Toolbar";

/** Name + subtitle. Hovering the name collapses it to the initials "J G". */
export function NameBlock({ subtitle }: { subtitle: string | string[] }) {
  const items = Array.isArray(subtitle) ? subtitle : [subtitle];
  return (
    <div className="fade-in mb-6 desktop:mb-8">
      <Link href="/" className="block w-fit rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-neutral-300">
        <h1 className="group/name w-fit select-none text-sm font-semibold leading-5 text-foreground">
          <span>J</span>
          <span className="transition-colors duration-150 group-hover/name:text-neutral-300 dark:group-hover/name:text-neutral-700">
            ohn
          </span>{" "}
          <span>G</span>
          <span className="transition-colors duration-150 group-hover/name:text-neutral-300 dark:group-hover/name:text-neutral-700">
            eorge
          </span>
        </h1>
      </Link>
      <p className="text-sm leading-5 text-neutral-400 dark:text-neutral-600">
        <RotatingText items={items} />
      </p>
    </div>
  );
}

/** Toolbar + live clock. Fades in on page hover on desktop, always visible on mobile. */
export function TopBar({ active, className = "" }: { active: ActivePage; className?: string }) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="transition-opacity duration-300 desktop:opacity-0 desktop:group-hover/page:opacity-100 desktop:group-focus-within/page:opacity-100">
        <Toolbar active={active} />
      </div>
      <Clock timeZone={profile.timeZone} />
    </div>
  );
}
