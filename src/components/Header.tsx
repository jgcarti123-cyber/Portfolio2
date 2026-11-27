import Image from "next/image";
import Link from "next/link";
import { ArrowDown } from "@phosphor-icons/react/dist/ssr";
import { profile, resume } from "@/data/site";
import { getPosts } from "@/lib/blog";
import { getPhotos } from "@/lib/photos";
import { NamePhotos } from "./NamePhotos";
import { Clock } from "./Clock";
import { OnlineDot } from "./OnlineDot";
import { SoundToggle, Toolbar } from "./Toolbar";

/**
 * The top of every page: John's name stacked like a logo, with the pages as huge words beside it (the current one
 * full size, the rest small so every page stays in view), all in white over a photo of the sky. Resume, sound and
 * the clock sit in the top-right corner. On phones the name sits above the words instead. It lives in the root
 * layout, so it stays put while the page below it changes.
 */
export function GiantHeader() {
  return (
    <header className="giant-head on-photo dark fade-in relative isolate overflow-hidden px-5 pt-3 sm:px-8">
      {/* The sky behind the name and the page words. The header runs in dark colours so its text sits in white. */}
      <Image src="/header-sky.jpg" alt="" fill priority quality={90} sizes="100vw" className="-z-10 object-cover" />
      {/* Resume, sound and the clock in the top-right corner, stopping short of the pull cord's bulb. */}
      <div className="relative z-[2] mr-9 flex items-center justify-end gap-3 sm:mr-14">
        <a
          href={resume}
          download
          className="mr-1.5 inline-flex h-[30px] items-center gap-1.5 rounded-full bg-white/10 px-3.5 text-[13px] font-medium text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.18)] outline-none backdrop-blur-md transition-colors duration-200 hover:bg-white/[0.16] focus-visible:ring-2 focus-visible:ring-white/40"
        >
          Resume
          <ArrowDown size={12} weight="bold" aria-hidden />
        </a>
        <SoundToggle />
        <Clock timeZone={profile.timeZone} />
      </div>
      <div className="mt-2.5 flex flex-col gap-2.5 md:mt-1.5 md:flex-row md:items-start md:gap-[2.2vw]">
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
