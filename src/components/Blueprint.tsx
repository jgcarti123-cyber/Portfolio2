"use client";

import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import {
  ArrowsOutCardinal,
  Cpu,
  Database,
  FileText,
  Flask,
  HardDrives,
  Package,
  ShieldCheck,
  Sparkle,
  User,
  UserCheck,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { Arch, PartKind } from "@/data/architecture";

const partIcon: Record<PartKind, PhosphorIcon> = {
  actor: User,
  source: FileText,
  service: HardDrives,
  model: Sparkle,
  tool: Wrench,
  guard: ShieldCheck,
  human: UserCheck,
  store: Database,
  output: Package,
  quality: Flask,
  hardware: Cpu,
};

const W = 640;
const H = 300;
const GAP = 104;
const PAD = 26;
const PART_TOP = 70;
const PART_H = 96;
const PART_GAP = 12;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const TILT = 57;

const slot = (i: number, count: number) => {
  const w = (W - PAD * 2 - PART_GAP * (count - 1)) / count;
  const x = PAD + i * (w + PART_GAP);
  return { x, w, cx: x + w / 2, cy: PART_TOP + PART_H / 2 };
};

/** Links between neighbouring layers: every part reaches the part(s) below it, spread evenly. */
function linksOf(arch: Arch) {
  const out: { from: [number, number]; to: [number, number] }[] = [];
  arch.layers.forEach((l, i) => {
    const below = arch.layers[i + 1];
    if (!below) return;
    const a = l.parts.length;
    const b = below.parts.length;
    const seen = new Set<string>();
    const add = (p: number, q: number) => {
      const k = `${p}:${q}`;
      if (seen.has(k)) return;
      seen.add(k);
      out.push({ from: [i, p], to: [i + 1, q] });
    };
    for (let q = 0; q < b; q++) add(b === 1 ? 0 : Math.round((q * (a - 1)) / (b - 1)), q);
    for (let p = 0; p < a; p++) add(p, a === 1 ? 0 : Math.round((p * (b - 1)) / (a - 1)));
  });
  return out;
}

/** A straight line of light between two points in the stack, with a spark running along it. */
function Beam({
  a,
  b,
  accent,
  lit,
  dim,
  delay,
}: {
  a: [number, number, number];
  b: [number, number, number];
  accent: string;
  lit: boolean;
  dim: boolean;
  delay: number;
}) {
  const [dx, dy, dz] = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  // Rounded so the server and the browser print the same numbers.
  const r = (v: number) => Math.round(v * 100) / 100;
  const len = r(Math.hypot(dx, dy, dz));
  const rz = r((Math.atan2(dy, dx) * 180) / Math.PI);
  const ry = r((-Math.asin(dz / Math.hypot(dx, dy, dz)) * 180) / Math.PI);
  const line: CSSProperties = {
    position: "absolute",
    inset: "-1px 0",
    background: `linear-gradient(90deg, color-mix(in srgb, ${accent} 60%, white), ${accent} 50%, color-mix(in srgb, ${accent} 60%, white))`,
    boxShadow: `0 0 8px ${accent}`,
  };
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0 top-0"
      style={{
        width: len,
        height: 0,
        transformOrigin: "0 0",
        transformStyle: "preserve-3d",
        transform: `translate3d(${a[0]}px, ${a[1]}px, ${a[2]}px) rotateZ(${rz}deg) rotateY(${ry}deg)`,
        opacity: dim ? 0.15 : lit ? 1 : 0.75,
        transition: "opacity 0.4s ease, transform 1s " + EASE,
      }}
    >
      <span style={line} />
      <span style={{ ...line, transform: "rotateX(90deg)" }} />
      <span
        className="bp-spark absolute -top-[2px] left-0 size-1 rounded-full bg-white"
        style={{ "--len": `${len}px`, "--glow": accent, animationDelay: `${delay}ms` } as CSSProperties}
      />
    </div>
  );
}

/**
 * A project's architecture drawn as a lit blueprint: dark glass layers stacked in 3D, parts on each, and live
 * links of light running between them. It hints at the system rather than walking through it. `mini` renders
 * the same scene small and untouchable, for the home page.
 */
export function Blueprint({
  arch,
  accent,
  video,
  title,
  mini = false,
  className = "",
}: {
  arch: Arch;
  accent: string;
  video?: string;
  title?: string;
  mini?: boolean;
  className?: string;
}) {
  const n = arch.layers.length;
  const [turn, setTurn] = useState(-32);
  const [dragging, setDragging] = useState(false);
  const [lift, setLift] = useState<number | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [scale, setScale] = useState(mini ? 0.3 : 0.86);
  const drag = useRef<{ x: number; turn: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const links = useMemo(() => linksOf(arch), [arch]);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () =>
      setScale(
        mini
          ? Math.min(el.clientWidth / 720, el.clientHeight / 680)
          : Math.min(0.95, Math.max(0.44, el.clientWidth / 920)),
      );
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mini]);

  const zOf = (i: number) => GAP * (n - 1 - i) + (lift === null ? 0 : i === lift ? 24 : i < lift ? 90 : 0);
  const point = (layer: number, part: number, dz: number): [number, number, number] => {
    const l = arch.layers[layer];
    const s = l.video && video ? { cx: W / 2, cy: H / 2 } : slot(part, l.parts.length);
    return [s.cx, s.cy, zOf(layer) + dz];
  };
  const parts = arch.layers.reduce((s, l) => s + l.parts.length, 0);

  const onDown = (e: PointerEvent) => {
    if (mini) return;
    drag.current = { x: e.clientX, turn };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (drag.current) setTurn(drag.current.turn + (e.clientX - drag.current.x) * 0.3);
  };
  const onUp = () => {
    drag.current = null;
    setDragging(false);
  };

  const height = mini ? undefined : (H * 0.6 + GAP * n) * scale + 140;

  return (
    <div
      ref={box}
      className={`bp relative select-none overflow-hidden ${mini ? "" : "cursor-grab touch-pan-y active:cursor-grabbing"} ${className}`}
      style={{ height, perspective: mini ? "1600px" : "2400px", "--accent": accent } as CSSProperties}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={() => setHover(null)}
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: W,
          height: H,
          transformStyle: "preserve-3d",
          transform: `translate(-50%, -30%) scale(${scale}) rotateX(${TILT}deg) rotateZ(${turn}deg)`,
          transition: dragging ? "none" : `transform 1.2s ${EASE}`,
        }}
      >
        <div className="bp-drift absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {arch.layers.map((l, i) => {
            const showVideo = l.video && video;
            return (
              <div
                key={l.name}
                onClick={() => !mini && setLift(lift === i ? null : i)}
                className={`bp-plane absolute inset-0 rounded-[22px] ${l.model ? "bp-plane-model" : ""} ${mini ? "" : "cursor-pointer"}`}
                style={{
                  transform: `translateZ(${zOf(i)}px)`,
                  opacity: lift !== null && i < lift ? 0.18 : 1,
                  transition: `transform 1s ${EASE}, opacity 0.5s ease`,
                }}
              >
                {showVideo && (
                  <>
                    <video
                      src={video}
                      className="absolute inset-2.5 h-[calc(100%-20px)] w-[calc(100%-20px)] rounded-[14px] object-cover opacity-70"
                      muted
                      autoPlay
                      loop
                      playsInline
                    />
                    <span className="absolute inset-2.5 rounded-[14px] bg-gradient-to-t from-black/60 to-transparent" />
                  </>
                )}
                <span className="absolute left-[26px] top-[24px] font-mono text-[12px] uppercase tracking-[0.14em] text-white/55">
                  {String(i + 1).padStart(2, "0")} — {l.name}
                </span>
                {!showVideo &&
                  l.parts.map((p, j) => {
                    const s = slot(j, l.parts.length);
                    const I = partIcon[p.kind];
                    const key = `${i}:${j}`;
                    return (
                      <span
                        key={p.label}
                        onPointerEnter={() => !mini && setHover(key)}
                        onPointerLeave={() => setHover(null)}
                        className="bp-part absolute flex flex-col justify-between rounded-[14px] p-3.5"
                        data-on={hover === key || undefined}
                        style={{ left: s.x, top: PART_TOP, width: s.w, height: PART_H }}
                      >
                        <I size={20} weight={l.model ? "fill" : "regular"} className="text-[var(--accent)]" />
                        <span className="min-w-0">
                          <span className="block truncate text-[16px] font-medium leading-5 text-white">{p.label}</span>
                          <span className="block truncate text-[12px] text-white/45">{p.sub}</span>
                        </span>
                      </span>
                    );
                  })}
              </div>
            );
          })}

          {links.map((k, idx) => {
            const from = `${k.from[0]}:${k.from[1]}`;
            const to = `${k.to[0]}:${k.to[1]}`;
            const lit = hover === from || hover === to;
            return (
              <Beam
                key={idx}
                a={point(k.from[0], k.from[1], -2)}
                b={point(k.to[0], k.to[1], 2)}
                accent={accent}
                lit={lit}
                dim={hover !== null && !lit}
                delay={(idx * 397) % 2400}
              />
            );
          })}
        </div>
      </div>

      {!mini && (
        <>
          <div className="pointer-events-none absolute left-6 top-6 font-mono text-[11px] uppercase tracking-[0.16em] text-white/45 sm:left-8 sm:top-7">
            <span className="text-white/80">{title ?? "System"}</span> / architecture
            <span className="mt-1.5 block">
              {n} layers · {parts} components · {links.length} links
            </span>
          </div>
          <span className="pointer-events-none absolute bottom-5 left-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white/40 sm:left-8">
            <ArrowsOutCardinal size={12} /> Drag · tap a layer to open it
          </span>
        </>
      )}
    </div>
  );
}
