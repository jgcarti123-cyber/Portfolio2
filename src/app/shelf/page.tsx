import type { Metadata } from "next";
import { NameBlock, TopBar } from "@/components/Header";
import { ShelfBrowser } from "@/components/ShelfBrowser";
import { shelf } from "@/data/shelf";

export const metadata: Metadata = {
  title: "Shelf",
  description: "Tools, frameworks, reads, music and resources I keep coming back to.",
};

export default function ShelfPage() {
  return (
    <div className="group/page">
      <main className="mx-auto max-w-[1120px] px-5 pb-32 pt-12 sm:px-8">
        <div className="flex flex-col desktop:grid desktop:grid-cols-[260px_1fr] desktop:gap-x-16">
          <NameBlock subtitle="Curated Shelf" />
          <TopBar active="shelf" className="fade-in -mt-2 mb-8 desktop:mt-0 desktop:self-start desktop:pt-5" />
        </div>
        <ShelfBrowser lists={shelf} />
      </main>
    </div>
  );
}
