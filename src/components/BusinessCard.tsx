"use client";

import { useRef, useState, type PointerEvent } from "react";
import { ArrowDown, Check } from "@phosphor-icons/react/dist/ssr";
import { connect, experience, profile, resume } from "@/data/site";
import { tellMascot } from "@/lib/mascot";
import { Icon } from "./Icon";

const [job, school] = experience;

/**
 * Experience and contact as one graphite card, like a metal business card, set over the closing photo. A streak of
 * light sweeps across it every few seconds; with a mouse it tilts toward the cursor, the streak and a soft glow follow
 * it, and the rim nearest it catches the light. Clicking anywhere but the links copies the email address.
 */
export function BusinessCard() {
  const card = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const el = card.current;
    if (!el || e.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.transitionDuration = "160ms";
    el.style.transform = `rotateX(${(0.5 - y) * 12}deg) rotateY(${(x - 0.5) * 16}deg)`;
    el.style.setProperty("--x", `${x * 100}%`);
    el.style.setProperty("--y", `${y * 100}%`);
    el.dataset.lit = "";
  }

  function onLeave() {
    const el = card.current;
    if (!el) return;
    el.style.transitionDuration = "";
    el.style.transform = "";
    delete el.dataset.lit;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      tellMascot({ type: "email" });
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  return (
    <div className="flex w-full flex-col items-center">
      <div className="w-full max-w-[460px] [perspective:1200px]" onPointerMove={onMove} onPointerLeave={onLeave}>
        <div
          ref={card}
          className="bcard relative flex aspect-[440/262] w-full flex-col overflow-hidden rounded-[20px] p-[clamp(20px,6%,28px)] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08),inset_0_0_0_1px_rgb(255_255_255/0.05),0_2px_4px_rgb(0_0_0/0.12),0_30px_60px_-20px_rgb(0_0_0/0.45)] [background:radial-gradient(120%_140%_at_20%_0%,#2c2c2e_0%,#161617_55%,#0d0d0e_100%)]"
        >
          {/* A fixed sheen, a streak of light that sweeps across now and then (and follows the cursor on hover), the
              glow that follows the cursor, the bright rim nearest it, and a little grain. */}
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgb(255_255_255/0.07)_45%,transparent_60%)]" />
          <span aria-hidden className="bcard-sweep pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" />
          <span aria-hidden className="bcard-light pointer-events-none absolute inset-0" />
          <span aria-hidden className="bcard-edge pointer-events-none absolute inset-0 rounded-[inherit]" />
          <span aria-hidden className="bcard-grain pointer-events-none absolute inset-0" />

          {/* The whole card copies the email; the links sit above it. */}
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? "Email copied" : `Copy email address, ${profile.email}`}
            className="absolute inset-0 cursor-copy rounded-[20px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/40"
          />

          <div className="pointer-events-none relative flex items-start justify-between">
            <p className="font-[family-name:var(--font-grotesk)] text-[23px] font-semibold leading-none tracking-[-0.025em]">{profile.name}</p>
            <span className="font-[family-name:var(--font-grotesk)] text-[13px] font-bold tracking-[-0.02em] text-white/50">JG</span>
          </div>
          <p className="pointer-events-none relative mt-2.5 font-[family-name:var(--font-grotesk)] leading-[1.45]">
            <span className="text-[14.5px] font-medium text-white/80">
              {job.title} at {job.subtitle}
            </span>
            <br />
            <span className="text-[13.5px] font-light text-white/55">Since {job.since}</span>
          </p>
          <p className="pointer-events-none relative mt-auto truncate font-[family-name:var(--font-grotesk)] text-[12.5px] font-light text-white/50">
            {school.subtitle} · {school.title}
          </p>
          <div className="relative mt-4 flex items-center gap-1">
            {connect.map((c) => (
              <a
                key={c.subtitle}
                href={c.href}
                aria-label={c.subtitle}
                title={c.subtitle}
                className="-m-0.5 flex size-8 items-center justify-center rounded-lg text-white/65 outline-none transition-colors duration-150 hover:bg-white/[0.08] hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"
                {...(c.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                <Icon name={c.icon} size={17} />
              </a>
            ))}
            <span className="flex-1" />
            <a
              href={resume}
              download
              className="-mr-2 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 font-[family-name:var(--font-grotesk)] text-[13px] font-semibold text-white outline-none transition-colors duration-150 hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Resume
              <ArrowDown size={12} weight="bold" aria-hidden />
            </a>
          </div>
        </div>
      </div>
      <p aria-live="polite" className="mt-6 flex items-center gap-1.5 text-[13px] text-white/85 [text-shadow:0_1px_10px_rgb(60_0_10/0.6)]">
        {copied ? (
          <>
            <Check size={13} weight="bold" className="text-emerald-300" /> Email copied
          </>
        ) : (
          <span>
            {profile.email} · <span className="[@media(hover:none)]:hidden">Click</span>
            <span className="hidden [@media(hover:none)]:inline">Tap</span> the card to copy
          </span>
        )}
      </p>
    </div>
  );
}
