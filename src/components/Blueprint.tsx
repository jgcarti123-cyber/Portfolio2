"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowsIn,
  Minus,
  Plus,
  X,
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

export const partIcon: Record<PartKind, PhosphorIcon> = {
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
const GAP_MINI = 96;
const GAP_FULL = 128;
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
      className="bp-beam pointer-events-none absolute left-0 top-0"
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

export type BlueprintHandle = { openLayer: (layer: number, part?: number) => void };

/**
 * A project's architecture drawn as a lit blueprint: glass layers stacked in 3D, parts on each, and live links of
 * light between them. Tapping a layer lifts that whole layer out to the front, flat and readable, and it flies
 * back into the stack when closed. `mini` renders the same scene small and untouchable, for the home page.
 */
export function Blueprint({
  arch,
  accent,
  video,
  title,
  mini = false,
  highlight = null,
  ref,
  className = "",
  stageClass = "h-[320px] sm:h-[460px]",
}: {
  arch: Arch;
  accent: string;
  video?: string;
  title?: string;
  mini?: boolean;
  /** Parts to light up ("layer:part"), e.g. the ones a hovered idea runs through. Everything else dims. */
  highlight?: string[] | null;
  /** Lets the page lift a layer out from elsewhere (an idea's chain of steps). */
  ref?: Ref<BlueprintHandle>;
  className?: string;
  /** Height classes for the full-size stage. */
  stageClass?: string;
}) {
  const n = arch.layers.length;
  // Layers sit further apart in the full view, so each one can be read on its own.
  const GAP = mini ? GAP_MINI : GAP_FULL;
  const [turn, setTurn] = useState(-30);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [scale, setScale] = useState(mini ? 0.3 : 0.8);
  const [picked, setPicked] = useState<{ layer: number; part?: number; from?: DOMRect; host?: Element | null } | null>(null);
  const [view, setView] = useState({ z: 1, x: 0, y: 0 });
  const [instant, setInstant] = useState(false);
  const drag = useRef<{ x: number; turn: number; moved: boolean } | null>(null);
  const dragged = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  const viewRef = useRef(view);
  const instantTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; mid: { x: number; y: number }; view: typeof view } | null>(null);
  const links = useMemo(() => linksOf(arch), [arch]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    // Fit the stack to the stage, by width and by height.
    const tall = H * 0.55 + GAP * (n - 1) * 0.84 + 70;
    const fit = () =>
      setScale(
        mini
          ? Math.min(el.clientWidth / 720, el.clientHeight / 680)
          : Math.min(0.95, el.clientWidth / 880, (el.clientHeight - 120) / tall),
      );
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mini, n, GAP]);

  // Centre what is drawn: where each layer's corners land after the tilt and turn, and the middle of that outline.
  const nudge = useMemo(() => {
    const t = (turn * Math.PI) / 180;
    const f = (TILT * Math.PI) / 180;
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < n; i++) {
      const z = GAP * (n - 1 - i);
      for (const [cx, cy] of [[-W / 2, -H / 2], [W / 2, -H / 2], [W / 2, H / 2], [-W / 2, H / 2]]) {
        const x1 = cx * Math.cos(t) - cy * Math.sin(t);
        const y1 = cx * Math.sin(t) + cy * Math.cos(t);
        xs.push(x1);
        ys.push(y1 * Math.cos(f) - z * Math.sin(f));
      }
    }
    return {
      x: Math.round((-(Math.min(...xs) + Math.max(...xs)) / 2) * scale),
      // Perspective draws the upper layers a little larger, so sit the outline slightly low.
      y: Math.round((-(Math.min(...ys) + Math.max(...ys)) / 2) * scale + (mini ? 0 : 14)),
    };
  }, [turn, scale, n, mini, GAP]);

  const clampView = useCallback((v: { z: number; x: number; y: number }) => {
    const el = box.current;
    const z = Math.min(2.6, Math.max(0.6, v.z));
    const room = Math.max(0, z - 1);
    const mx = (el?.clientWidth ?? 800) * 0.55 * room;
    const my = (el?.clientHeight ?? 400) * 0.55 * room;
    return { z, x: Math.max(-mx, Math.min(mx, v.x)), y: Math.max(-my, Math.min(my, v.y)) };
  }, []);

  /** Zoom by `f`, keeping the point (cx, cy) from the stage centre where it is on screen. */
  const zoomAt = useCallback(
    (f: number, cx = 0, cy = 0) =>
      setView((v) => {
        const z = Math.min(2.6, Math.max(0.6, v.z * f));
        const k = z / v.z;
        return clampView({ z, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k });
      }),
    [clampView],
  );

  const flashInstant = useCallback(() => {
    setInstant(true);
    clearTimeout(instantTimer.current);
    instantTimer.current = setTimeout(() => setInstant(false), 160);
  }, []);

  // Pinch on a trackpad (or ctrl/cmd + scroll) zooms toward the pointer; once zoomed in, scrolling pans.
  useEffect(() => {
    const el = box.current;
    if (!el || mini) return;
    const onWheel = (e: WheelEvent) => {
      const r = el.getBoundingClientRect();
      const cx = e.clientX - r.left - r.width / 2;
      const cy = e.clientY - r.top - r.height / 2;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomAt(Math.exp(-e.deltaY * 0.01), cx, cy);
        flashInstant();
      } else if (viewRef.current.z > 1.02) {
        e.preventDefault();
        setView((v) => clampView({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
        flashInstant();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [mini, zoomAt, clampView, flashInstant]);

  const planeOf = useCallback(
    (layer: number) => box.current?.querySelector<HTMLElement>(`.bp-plane[data-layer="${layer}"]`) ?? null,
    [],
  );

  const openLayer = useCallback(
    (layer: number, part?: number) => {
      if (mini) return;
      // The card goes into the open project dialog (the top layer), so it sits above the whole page.
      setPicked({ layer, part, from: planeOf(layer)?.getBoundingClientRect(), host: box.current?.closest("dialog") ?? null });
    },
    [mini, planeOf],
  );

  useImperativeHandle(ref, () => ({ openLayer }), [openLayer]);

  const midOf = (el: HTMLElement) => {
    const [a, b] = [...pointers.current.values()];
    const r = el.getBoundingClientRect();
    return {
      dist: Math.hypot(a.x - b.x, a.y - b.y),
      mid: { x: (a.x + b.x) / 2 - r.left - r.width / 2, y: (a.y + b.y) / 2 - r.top - r.height / 2 },
    };
  };
  // A drag only starts after a few pixels, so a plain tap still opens the layer under it.
  const onDown = (e: PointerEvent) => {
    if (mini || picked) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      drag.current = null;
      pinch.current = { ...midOf(e.currentTarget as HTMLElement), view: viewRef.current };
      for (const id of pointers.current.keys()) (e.currentTarget as HTMLElement).setPointerCapture(id);
      return;
    }
    drag.current = { x: e.clientX, turn, moved: false };
    dragged.current = false;
  };
  const onMove = (e: PointerEvent) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const p = pinch.current;
    if (p && pointers.current.size === 2) {
      const m = midOf(e.currentTarget as HTMLElement);
      const z = Math.min(2.6, Math.max(0.6, p.view.z * (m.dist / p.dist)));
      const k = z / p.view.z;
      setView(clampView({ z, x: m.mid.x - (p.mid.x - p.view.x) * k, y: m.mid.y - (p.mid.y - p.view.y) * k }));
      flashInstant();
      dragged.current = true;
      return;
    }
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      setDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (d.moved) setTurn(d.turn + dx * 0.3);
  };
  const onUp = (e: PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    dragged.current = dragged.current || !!drag.current?.moved;
    drag.current = null;
    setDragging(false);
  };

  const zOf = (i: number) => GAP * (n - 1 - i) + (hover === i && !mini ? 14 : 0);
  const point = (layer: number, part: number, dz: number): [number, number, number] => {
    const l = arch.layers[layer];
    const s = l.video && video ? { cx: W / 2, cy: H / 2 } : slot(part, l.parts.length);
    return [s.cx, s.cy, zOf(layer) + dz];
  };
  const parts = arch.layers.reduce((s, l) => s + l.parts.length, 0);
  const lit = (key: string) => !!highlight?.includes(key);
  const quiet = (key: string) => !!highlight?.length && !highlight.includes(key);
  const layerLit = (i: number) => !!highlight?.some((k) => k.startsWith(`${i}:`));

  return (
    <div
      ref={box}
      data-ui
      className={`bp relative select-none overflow-hidden ${mini ? "" : `${stageClass} cursor-grab touch-pan-y active:cursor-grabbing`} ${className}`}
      style={{ "--accent": accent } as CSSProperties}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={() => setHover(null)}
    >
      <div className="absolute inset-0" style={{ perspective: mini ? "1600px" : "2400px" }}>
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: W,
            height: H,
            transformStyle: "preserve-3d",
            transform: `translate(calc(-50% + ${nudge.x * view.z + view.x}px), calc(-50% + ${nudge.y * view.z + view.y}px)) scale(${scale * view.z}) rotateX(${TILT}deg) rotateZ(${turn}deg)`,
            transition: dragging || instant ? "none" : `transform 0.9s ${EASE}`,
          }}
        >
          <div className="bp-drift absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
            {arch.layers.map((l, i) => {
              const showVideo = l.video && video;
              const quietLayer = !!highlight?.length && !layerLit(i);
              return (
                <div
                  key={l.name}
                  data-layer={i}
                  data-hover={(!mini && hover === i) || undefined}
                  data-out={picked?.layer === i || undefined}
                  data-quiet={quietLayer || undefined}
                  onPointerEnter={() => !mini && setHover(i)}
                  onPointerLeave={() => setHover((h) => (h === i ? null : h))}
                  onClick={() => {
                    if (mini || dragged.current) return;
                    openLayer(i);
                  }}
                  className={`bp-plane absolute inset-0 rounded-[22px] ${l.model ? "bp-plane-model" : ""} ${mini ? "" : "cursor-pointer"}`}
                  style={{ transform: `translateZ(${zOf(i)}px)` }}
                >
                  {showVideo && (
                    <>
                      <video
                        src={video}
                        className="absolute inset-2.5 h-[calc(100%-20px)] w-[calc(100%-20px)] rounded-[14px] object-cover"
                        muted
                        autoPlay
                        loop
                        playsInline
                      />
                      <span className="absolute inset-2.5 rounded-[14px] bg-black/25" />
                    </>
                  )}
                  <span className="bp-label absolute left-[24px] top-[16px] text-[22px] font-medium tracking-[-0.015em]">{l.name}</span>
                  {!showVideo &&
                    l.parts.map((p, j) => {
                      const s = slot(j, l.parts.length);
                      const I = partIcon[p.kind];
                      const key = `${i}:${j}`;
                      return (
                        <span
                          key={p.label}
                          className="bp-part absolute flex flex-col justify-between rounded-[14px] p-3.5"
                          data-on={lit(key) || undefined}
                          data-quiet={quiet(key) || undefined}
                          style={{ left: s.x, top: PART_TOP, width: s.w, height: PART_H }}
                        >
                          <I size={26} weight={l.model ? "fill" : "duotone"} className="text-[var(--accent)]" />
                          <span className="block truncate text-[20px] font-medium leading-6 tracking-[-0.01em] text-white">{p.label}</span>
                        </span>
                      );
                    })}
                </div>
              );
            })}

            {links.map((k, idx) => {
              const from = `${k.from[0]}:${k.from[1]}`;
              const to = `${k.to[0]}:${k.to[1]}`;
              const on = highlight?.length ? highlight.includes(from) && highlight.includes(to) : false;
              return (
                <Beam
                  key={idx}
                  a={point(k.from[0], k.from[1], -2)}
                  b={point(k.to[0], k.to[1], 2)}
                  accent={accent}
                  lit={on}
                  dim={!!highlight?.length && !on}
                  delay={(idx * 397) % 2400}
                />
              );
            })}
          </div>
        </div>
      </div>

      {!mini && (
        <>
          <div className="pointer-events-none absolute left-5 top-4">
            <p className="text-[15px] font-medium tracking-[-0.015em] text-white">{title ?? "System"}</p>
            <p className="mt-0.5 font-[family-name:var(--font-inter)] text-[12px] text-white/50">
              {n} layers, {parts} parts, {links.length} connections
            </p>
          </div>
          <p className="pointer-events-none absolute bottom-5 left-5 font-[family-name:var(--font-inter)] text-[12px] text-white/55">
            {hover !== null ? `Open the ${arch.layers[hover].name} layer` : "Tap a layer to bring it forward"}
          </p>
          <div
            className="absolute bottom-3 right-3 z-10 flex items-center gap-0.5 rounded-full bg-white/[0.08] p-1 text-white"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={() => zoomAt(1 / 1.3)} aria-label="Zoom out" className="bp-zoom">
              <Minus size={14} />
            </button>
            <span className="w-10 text-center font-[family-name:var(--font-inter)] text-[12px] tabular-nums text-white/65" aria-live="polite">
              {Math.round(view.z * 100)}%
            </span>
            <button type="button" onClick={() => zoomAt(1.3)} aria-label="Zoom in" className="bp-zoom">
              <Plus size={14} />
            </button>
            <button
              type="button"
              onClick={() => setView({ z: 1, x: 0, y: 0 })}
              aria-label="Fit to view"
              disabled={view.z === 1 && view.x === 0 && view.y === 0}
              className="bp-zoom"
            >
              <ArrowsIn size={14} />
            </button>
          </div>
          {picked && (
            <LayerCard
              key="card"
              arch={arch}
              accent={accent}
              picked={picked}
              host={picked.host ?? null}
              planeOf={planeOf}
              onPick={(layer) => setPicked((p) => ({ layer, host: p?.host }))}
              onClose={() => setPicked(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

/**
 * One layer, lifted out of the stack to the front of the page: flat, full size and readable. It flies out of the
 * layer's place (which stays empty while it is out) and flies back when closed by tapping outside, the close
 * button or Esc. The arrows move up and down the stack.
 */
function LayerCard({
  arch,
  accent,
  picked,
  host,
  planeOf,
  onPick,
  onClose,
}: {
  arch: Arch;
  accent: string;
  picked: { layer: number; part?: number; from?: DOMRect; host?: Element | null };
  host: Element | null;
  planeOf: (layer: number) => HTMLElement | null;
  onPick: (layer: number) => void;
  onClose: () => void;
}) {
  const card = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLButtonElement>(null);
  const leaving = useRef(false);
  const layer = arch.layers[picked.layer];
  const n = arch.layers.length;
  const from = picked.from;

  // Fly out of the layer's place on open; moving to another layer cross-fades in place.
  useLayoutEffect(() => {
    const el = card.current;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (from && !still) {
      const to = el.getBoundingClientRect();
      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top + from.height / 2 - (to.top + to.height / 2);
      const sx = Math.max(0.15, from.width / to.width);
      const sy = Math.max(0.1, from.height / to.height);
      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 0.5, borderRadius: "28px" },
          { transform: "none", opacity: 1 },
        ],
        { duration: 520, easing: EASE },
      );
      scrim.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease-out" });
    } else {
      el.animate([{ opacity: 0.4, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: EASE });
    }
  }, [from, picked.layer]);

  const close = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    const el = card.current;
    const to = planeOf(picked.layer)?.getBoundingClientRect();
    if (!el || !to || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return onClose();
    const r = el.getBoundingClientRect();
    const dx = to.left + to.width / 2 - (r.left + r.width / 2);
    const dy = to.top + to.height / 2 - (r.top + r.height / 2);
    const sx = Math.max(0.15, to.width / r.width);
    const sy = Math.max(0.1, to.height / r.height);
    scrim.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 360, easing: "ease-out", fill: "forwards" });
    el.animate(
      [
        { transform: "none", opacity: 1 },
        { transform: `translate(${dx * 0.9}px, ${dy * 0.9}px) scale(${sx * 1.1}, ${sy * 1.1})`, opacity: 0.85, offset: 0.8 },
        { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 0 },
      ],
      { duration: 440, easing: EASE, fill: "forwards" },
    ).onfinish = onClose;
  }, [onClose, picked.layer, planeOf]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close();
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        if (picked.layer < n - 1) onPick(picked.layer + 1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        if (picked.layer > 0) onPick(picked.layer - 1);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [close, onPick, picked.layer, n]);

  const ui = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={`${layer.name} layer`}>
      <button ref={scrim} type="button" aria-label="Back to the stack" onClick={close} className="bp-scrim absolute inset-0 cursor-default" />
      <div
        ref={card}
        className="relative max-h-full w-full max-w-[640px] overflow-y-auto rounded-[24px] bg-[#131416] p-6 text-white sm:p-7"
        style={{
          fontFamily: "var(--font-grotesk)",
          boxShadow: `inset 0 0 0 1px rgb(255 255 255 / 0.08), inset 0 0 0 1px color-mix(in srgb, ${accent} ${layer.model ? 60 : 0}%, transparent), 0 50px 120px -30px rgb(0 0 0 / 0.85)`,
          background: layer.model ? `color-mix(in srgb, ${accent} 14%, #131416)` : undefined,
        }}
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-[family-name:var(--font-inter)] text-[13px] text-white/45">
              Layer {picked.layer + 1} of {n}, from the top
            </p>
            <h4 className="mt-1 text-[30px] font-medium leading-none tracking-[-0.03em]">{layer.name}</h4>
            <p className="mt-3 max-w-[46ch] font-[family-name:var(--font-inter)] text-[15px] leading-[1.5] text-white/70">{layer.line}</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Back to the stack"
            className="-mr-2 -mt-1 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/[0.07] text-white/70 outline-none transition-colors hover:bg-white/[0.14] hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <X size={15} />
          </button>
        </div>

        <ul className={`mt-6 grid gap-2.5 ${layer.parts.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {layer.parts.map((p, j) => {
            const I = partIcon[p.kind];
            const on = picked.part === j;
            return (
              <li
                key={p.label}
                className="rounded-[16px] bg-white/[0.05] p-4"
                style={on ? { boxShadow: `inset 0 0 0 1.5px ${accent}` } : undefined}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-[10px]"
                    style={{ background: `color-mix(in srgb, ${accent} 18%, transparent)` }}
                  >
                    <I size={18} weight="fill" style={{ color: accent }} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[17px] font-medium leading-5 tracking-[-0.015em]">{p.label}</span>
                    <span className="block font-[family-name:var(--font-inter)] text-[12px] text-white/50">{p.sub}</span>
                  </span>
                </div>
                {p.detail && (
                  <p className="mt-3 font-[family-name:var(--font-inter)] text-[14px] leading-[1.5] text-white/75">{p.detail}</p>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={picked.layer === 0}
            onClick={() => onPick(picked.layer - 1)}
            className="flex h-10 cursor-pointer items-center gap-2 rounded-full bg-white/[0.07] px-4 text-[14px] text-white/80 outline-none transition-colors hover:bg-white/[0.14] hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-default disabled:opacity-30"
          >
            <ArrowLeft size={14} /> {picked.layer > 0 ? arch.layers[picked.layer - 1].name : "Top"}
          </button>
          <button
            type="button"
            disabled={picked.layer === n - 1}
            onClick={() => onPick(picked.layer + 1)}
            className="flex h-10 cursor-pointer items-center gap-2 rounded-full bg-white/[0.07] px-4 text-[14px] text-white/80 outline-none transition-colors hover:bg-white/[0.14] hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-default disabled:opacity-30"
          >
            {picked.layer < n - 1 ? arch.layers[picked.layer + 1].name : "Bottom"} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return host ? createPortal(ui, host) : ui;
}
