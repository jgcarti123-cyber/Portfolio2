"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { Photo } from "@/lib/photos";

/*
 * John's photos as a small folding fan pinned beside his name. Hovering the name block or the fan itself (or
 * tapping the name on a phone) unfolds it: the blades swing out around one rivet, the middle photo upright and
 * the others tilting out evenly, with thin ribs running back to the rivet. Moving away folds it shut and it
 * shrinks back into the little fan.
 *
 * Desktop: the closed fan sits after "John", above the "rge" of George, and opens upward from a rivet just
 * under the name. Phones: it sits to the right of the name and opens centred on the screen.
 *
 * The fan lives in a layer on <body> rather than in the header, because the header clips its overflow.
 */

type Geo = {
  // The rivet, closed and open, in page coordinates.
  rest: { x: number; y: number };
  open: { x: number; y: number };
  phone: boolean;
  layerH: number;
};

const SPREAD = 42; // degrees from the middle blade to an outer one, open
const REST_SPREAD = 18;

export function NamePhotos({ photos, children }: { photos: Photo[]; children: ReactNode }) {
  const zone = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [hot, setHot] = useState<number | null>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const measure = useCallback(() => {
    const h1 = zone.current?.querySelector("h1");
    if (!h1) return;
    const sx = window.scrollX;
    const sy = window.scrollY;
    const vw = document.documentElement.clientWidth;
    const phone = vw < 768;
    // The text itself, not the heading's box (which can be as wide as the column).
    const all = document.createRange();
    all.selectNodeContents(h1);
    const name = all.getBoundingClientRect();
    const [ohn, eorge] = Array.from(h1.querySelectorAll(":scope > span")) as HTMLElement[];
    let rest: Geo["rest"];
    if (!phone && ohn && eorge?.firstChild) {
      // After "John", above the "rge" of George: centred on the first line, over the last three letters.
      const line1 = ohn.getBoundingClientRect();
      const range = document.createRange();
      const text = eorge.firstChild as Text;
      range.setStart(text, Math.max(0, text.length - 3));
      range.setEnd(text, text.length);
      const rge = range.getBoundingClientRect();
      rest = { x: rge.left + rge.width / 2 + sx, y: line1.top + line1.height * 0.92 + sy };
    } else {
      // Phones: just after the name, centred on its line.
      rest = { x: name.right + 24 + sx, y: name.top + name.height * 0.95 + sy };
    }
    const openAt = phone
      ? { x: vw / 2 + sx, y: name.bottom + 250 + sy }
      : { x: name.right + 176 + sx, y: name.bottom + 150 + sy };
    setGeo({ rest, open: openAt, phone, layerH: openAt.y + 40 });
  }, []);

  useLayoutEffect(() => {
    if (!photos.length) return;
    measure();
    const ro = new ResizeObserver(measure);
    if (zone.current) ro.observe(zone.current);
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    document.fonts?.ready.then(measure);
    const head = zone.current?.closest("header");
    head?.addEventListener("animationend", measure);
    const timers = [300, 900, 1800].map((ms) => setTimeout(measure, ms));
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
      head?.removeEventListener("animationend", measure);
      timers.forEach(clearTimeout);
    };
  }, [photos.length, measure]);

  // Touch: a tap anywhere else folds the fan. Escape folds it everywhere.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      if (!(e.target as HTMLElement).closest("[data-name-photos]")) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!photos.length) return <>{children}</>;

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
    if (!open) measure();
    setOpen(true);
  };
  const hide = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 260);
  };
  const hover = {
    onPointerEnter: (e: React.PointerEvent) => e.pointerType === "mouse" && show(),
    onPointerLeave: (e: React.PointerEvent) => e.pointerType === "mouse" && hide(),
  };

  const n = photos.length;
  const mid = (n - 1) / 2;
  const phone = geo?.phone ?? false;
  // Blade size and how far the photos sit from the rivet (the ribs fill the gap).
  const W = phone ? 104 : 124;
  const H = phone ? 142 : 168;
  const R = phone ? 58 : 74;
  const restScale = 0.15;

  const bladeTransform = (i: number) => {
    if (!geo) return "";
    const t = n > 1 ? (i - mid) / mid : 0;
    const p = open ? geo.open : geo.rest;
    const a = t * (open ? SPREAD : REST_SPREAD);
    const s = open ? 1 : restScale;
    return `translate(${p.x}px, ${p.y}px) rotate(${a}deg) scale(${s})`;
  };
  // Opening unfolds from the middle outward; closing folds the outer blades in first.
  const delay = (i: number) => `${(open ? Math.abs(i - mid) : mid - Math.abs(i - mid)) * 55}ms`;

  return (
    <>
      <div
        ref={zone}
        data-name-photos=""
        {...hover}
        onClickCapture={(e) => {
          // Phones: the name opens and closes the fan instead of going Home.
          if (window.matchMedia("(hover: none)").matches) {
            e.preventDefault();
            e.stopPropagation();
            if (!open) measure();
            setOpen((o) => !o);
          }
        }}
      >
        {children}
      </div>
      {geo &&
        createPortal(
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-40 overflow-hidden"
            style={{ height: geo.layerH }}
          >
            <div className={`name-fan ${open ? "is-open" : ""}`}>
              {photos.map((p, i) => {
                const z = hot === i && open ? 50 : n * 2 - Math.round(Math.abs(i - mid) * 2);
                return (
                  <div
                    key={p.src}
                    className={`name-blade absolute left-0 top-0 ${hot === i && open ? "is-hot" : ""}`}
                    style={{ transform: bladeTransform(i), transitionDelay: delay(i), zIndex: z }}
                  >
                    {/* The rib, from the rivet out to the photo. */}
                    <span className="name-rib absolute" style={{ left: -1, top: -R - 6, height: R + 6 }} />
                    <div
                      className="name-card absolute"
                      style={{ left: -W / 2, top: -R - H, width: W, height: H }}
                    >
                      <div className="relative size-full overflow-hidden rounded-[2px]">
                        <Image src={p.src} alt="" fill sizes="140px" className="object-cover" />
                      </div>
                    </div>
                    {/* The hover target stays put while the photo rises, so the photo can't slide out from
                        under the cursor and flicker. */}
                    <div
                      data-name-photos=""
                      onPointerEnter={(e) => {
                        hover.onPointerEnter(e);
                        setHot(i);
                      }}
                      onPointerLeave={(e) => {
                        hover.onPointerLeave(e);
                        setHot((h) => (h === i ? null : h));
                      }}
                      className="absolute"
                      style={{ left: -W / 2, top: -R - H, width: W, height: H, pointerEvents: "auto" }}
                    />
                  </div>
                );
              })}
              <span
                className="name-rivet absolute left-0 top-0"
                style={{
                  transform: `translate(${(open ? geo.open : geo.rest).x}px, ${(open ? geo.open : geo.rest).y}px) scale(${open ? 1 : 0.5})`,
                }}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
