import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostChips, PostSidebar } from "@/components/PostSidebar";
import { formatDate, getPost, getPosts } from "@/lib/blog";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
    openGraph: { title: post.title, description: post.summary, images: [post.cover], type: "article" },
  };
}

const mono = "font-[family-name:var(--font-mono)]";

export default async function PostPage({ params }: Params) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const share = { headings: post.headings, minutes: post.minutes, title: post.title, markdown: post.markdown };

  return (
    <main className="mx-auto max-w-[1120px] px-5 pb-32 pt-8 sm:px-8 desktop:pt-14">
      {/* The panorama: a wide strip of the post's picture across the full column. It opens like a shutter, from
          a thin slit to full height, while the picture settles from a slight zoom. */}
      <div className="pano-reveal relative aspect-[2.4/1] overflow-hidden rounded-[14px] bg-[var(--stage)] sm:aspect-[3.3/1] sm:rounded-[20px]">
        <Image
          src={post.cover}
          alt=""
          fill
          priority
          quality={92}
          sizes="(min-width: 1120px) 1056px, 100vw"
          className="pano-reveal-img object-cover"
          style={{ objectPosition: post.coverPosition }}
        />
      </div>

      <header className="fade-in mt-7 max-w-[820px] sm:mt-10" style={{ animationDelay: "60ms" }}>
        <div className={`flex flex-wrap gap-x-3 gap-y-1 text-xs uppercase tracking-[0.02em] text-[var(--ink-2)] sm:text-[12.5px] ${mono}`}>
          <Link href="/blog" className="rounded-sm outline-none transition-colors hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-neutral-300">
            ← All posts
          </Link>
          <span aria-hidden>·</span>
          <span>{post.tag}</span>
          <span aria-hidden>·</span>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          {/* Phones show reading time here; desktop has it under the progress bar. */}
          <span aria-hidden className="desktop:hidden">
            ·
          </span>
          <span className="desktop:hidden">{post.minutes} min read</span>
          {post.draft && (
            <>
              <span aria-hidden>·</span>
              <span className="text-[var(--ink)]">Draft</span>
            </>
          )}
        </div>
        <h1 className="mt-4 text-balance font-[family-name:var(--font-grotesk)] text-[34px] font-medium leading-[1.06] tracking-[-0.035em] sm:text-[56px] sm:leading-[1.04]">
          {post.title}
        </h1>
        {post.summary && (
          <p className="mt-4 max-w-[680px] text-base leading-[1.5] text-[var(--ink-2)] sm:text-[19px]">{post.summary}</p>
        )}
      </header>

      {/* No entrance animation on this wrapper: an animated parent would trap the phone bar beneath the
          window's top fade. The sidebar and article animate in on their own. */}
      <div className="mt-8 border-t border-[var(--hair)] pt-2 desktop:mt-14 desktop:grid desktop:grid-cols-[260px_1fr] desktop:gap-16 desktop:pt-8">
        <PostSidebar {...share} />
        <PostChips {...share} />
        <article
          id="post-body"
          className="post-body fade-in mt-4 desktop:mt-0"
          style={{ animationDelay: "120ms" }} dangerouslySetInnerHTML={{ __html: post.html }} />
      </div>
    </main>
  );
}
