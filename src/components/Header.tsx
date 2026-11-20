import Image from "next/image";
import Link from "next/link";
import { profile } from "@/data/site";
import { getPosts } from "@/lib/blog";
import { getPhotos } from "@/lib/photos";
import { NamePhotos } from "./NamePhotos";
import { Clock } from "./Clock";
import { OnlineDot } from "./OnlineDot";
import { SoundToggle, Toolbar } from "./Toolbar";

/**
 * The top quarter of every page: John's name stacked like a logo, with the pages as huge words starting right
 * beside it and running off the window edge, all in white over a photo of the sky. Clock and sound sit in the
 * top-right corner. On phones the name sits above the words instead. It lives in the root layout, so it stays
 * put while the page below it changes.
 */
export function GiantHeader() {
  return (
    <header className="giant-head on-photo dark fade-in relative isolate overflow-hidden px-5 pt-5 sm:px-8 md:pt-7">
      {/* The sky behind the name and the page words. The header runs in dark colours so its text sits in white. */}
      <Image src="/header-sky.jpg" alt="" fill priority quality={90} sizes="100vw" className="-z-10 object-cover" />
      <div className="absolute right-5 top-5 flex items-center gap-3 sm:right-8 md:top-7">
        <SoundToggle />
        <Clock timeZone={profile.timeZone} />
      </div>
      <div className="flex flex-col gap-6 md:mt-10 md:flex-row md:items-start md:gap-[2.2vw]">
        <Link
          href="/"
          className="group/name block shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 md:pt-[1.6vw]"
        >
          <NamePhotos photos={getPhotos()}>
          <h1 className="select-none font-[family-name:var(--font-grotesk)] text-[22px] font-medium leading-[0.95] tracking-[-0.03em] text-foreground md:text-[clamp(22px,2.3vw,36px)]">
            J
            <span className="transition-colors duration-150 group-hover/name:text-white/35">ohn</span>
            <br className="hidden md:block" /> G
            <span className="transition-colors duration-150 group-hover/name:text-white/35">eorge</span>
            <OnlineDot />
          </h1>
          <p className="mt-3 hidden text-[13px] leading-4 text-white/70 md:block">
            AI Engineer
            <br />
            Tata Motors
          </p>
          </NamePhotos>
        </Link>
        <div className="min-w-0 flex-1">
          <Toolbar blogCount={getPosts().length} />
        </div>
      </div>
    </header>
  );
}
