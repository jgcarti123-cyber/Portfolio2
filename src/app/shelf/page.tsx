import type { Metadata } from "next";
import { GiantHeader } from "@/components/Header";
import { ShelfBrowser } from "@/components/ShelfBrowser";
import { shelf } from "@/data/shelf";

export const metadata: Metadata = {
  title: "Shelf",
  description: "Tools, frameworks, reads, music and resources I keep coming back to.",
};

export default function ShelfPage() {
  return (
    <div className="group/page">
      <GiantHeader active="shelf" />
      <main className="mx-auto max-w-[1120px] px-5 pb-32 pt-10 sm:px-8">
        <ShelfBrowser lists={shelf} />
      </main>
    </div>
  );
}
