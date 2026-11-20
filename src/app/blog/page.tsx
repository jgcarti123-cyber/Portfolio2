import type { Metadata } from "next";
import { BlogList } from "@/components/BlogList";
import { formatDate, getPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Writing",
  description: "Things I'm building, breaking and learning, written down so I remember them.",
};

export default function BlogPage() {
  const posts = getPosts().map((p) => ({ ...p, dateLabel: formatDate(p.date) }));
  return (
    <main className="mx-auto max-w-[1120px] px-5 pb-32 pt-10 sm:px-8 desktop:pt-16">
      <div className="grid gap-8 desktop:grid-cols-[260px_1fr] desktop:gap-16">
        <aside className="fade-in desktop:sticky desktop:top-10 desktop:self-start">
          <h1 className="font-[family-name:var(--font-grotesk)] text-[30px] font-medium leading-[1.15] tracking-[-0.02em]">
            Writing
          </h1>
          <p className="mt-3 max-w-[260px] text-[15px] leading-[1.55] text-[var(--ink-2)]">
            Things I&rsquo;m building, breaking and learning, written down so I remember them.
          </p>
        </aside>
        <BlogList posts={posts} />
      </div>
    </main>
  );
}
