"use client";

import { useEffect, useRef, useState } from "react";
import { useC4Status } from "@/lib/c4-status";
import { useHydrated } from "@/lib/hooks";
import { hitBulb, kochiTime, lines, once, onMascot, pick } from "@/lib/mascot";
import { BALL, drawFrame, FRAMES, type FrameName } from "@/lib/mascot-sprites";
import { playChirp, playKick, playWhistle } from "@/lib/sound";

/**
 * J, the site's pixel footballer. J lives on the page itself: it stands on anything marked data-ground
 * (section rules, the project card, the GitHub graph, Connect 4, the footer, an open project sheet), rides
 * it as you scroll, and hops or falls to another one when it scrolls away. With nowhere to stand it waits on
 * the bottom edge of the window. It dribbles, juggles and naps on its ball, dives when poked, and chases
 * the ball when you kick it.
 */

const S = 2; // CSS pixels per sprite pixel
const BOX = 16; // J's canvas, in sprite pixels
const BALL_BOX = 7;
const G = 0.45; // gravity, px per frame²
const TOP_MIN = 64; // surfaces closer to the top sit under the top fade
const TOP_MIN_SHEET = 32;
const BOTTOM_MIN = 24;
const FLOOR_GAP = 10;
const NIGHT_UNTIL = 6; // J sleeps from midnight to 6am in Kochi
const SECOND = 60; // frames

type Surface = { el: Element | null; x1: number; x2: number; y: number };
type Mode =
  | "idle"
  | "walk"
  | "juggle"
  | "chase"
  | "air"
  | "roll"
  | "hurt"
  | "pose"
  | "slide"
  | "sleep"
  | "leave"
  | "gone"
  | "enter";
type Card = "yellow" | "red";
type Api = { poke: () => void; kick: (fromX: number) => void; say: (text: string, ms?: number) => void };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

export function Mascot() {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return <Player />;
}

function Player() {
  const root = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const sprite = useRef<HTMLCanvasElement>(null);
  const ball = useRef<HTMLButtonElement>(null);
  const ballSprite = useRef<HTMLCanvasElement>(null);
  const api = useRef<Api | null>(null);

  const [speech, setSpeech] = useState<{ text: string; id: number } | null>(null);
  const [card, setCard] = useState<{ color: Card; id: number } | null>(null);
  const [mark, setMark] = useState<"!" | "z" | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const el = root.current;
    const me = body.current;
    const canvas = sprite.current;
    const ballEl = ball.current;
    const ballCanvas = ballSprite.current;
    if (!el || !me || !canvas || !ballEl || !ballCanvas) return;
    const ctx = canvas.getContext("2d");
    const bctx = ballCanvas.getContext("2d");
    if (!ctx || !bctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.height = BOX * S * dpr;
    ballCanvas.width = ballCanvas.height = BALL_BOX * S * dpr;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = !window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // The popover API puts J in the top layer, above the theme flicker and (re-shown) above a project sheet.
    try {
      el.showPopover();
    } catch {}
    const raise = () => {
      if (!el.matches(":popover-open")) return;
      el.hidePopover();
      el.showPopover();
    };

    let seq = 0; // keys for the bubble and card, so a new one always animates in
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const later = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
      return id;
    };
    let speechTimer: ReturnType<typeof setTimeout> | undefined;
    const say = (text: string, ms = 2800) => {
      if (speechTimer) clearTimeout(speechTimer);
      setSpeech({ text, id: ++seq });
      speechTimer = later(() => setSpeech(null), ms);
    };
    let markTimer: ReturnType<typeof setTimeout> | undefined;
    const flash = (m: "!" | "z" | null, ms = 700) => {
      if (markTimer) clearTimeout(markTimer);
      setMark(m);
      if (m === "!") markTimer = later(() => setMark(null), ms);
    };

    // ---- Where J can stand -------------------------------------------------------------------------
    let grounds: Element[] = [];
    let dialog: Element | null = null;
    const lastY = new Map<Element | null, number>();
    const floor = (): Surface => ({ el: null, x1: 8, x2: window.innerWidth - 8, y: window.innerHeight - FLOOR_GAP });
    const surfaceOf = (target: Element | null): Surface | null => {
      if (target === null) return floor();
      if (!target.isConnected) return null;
      const r = target.getBoundingClientRect();
      if (r.width < 24) return null;
      return { el: target, x1: r.left, x2: r.right, y: r.top };
    };
    const usable = (s: Surface) => {
      if (s.el === null) return true;
      const inSheet = Boolean(dialog?.contains(s.el));
      if (dialog ? !inSheet : s.el.closest("dialog")) return false;
      return (
        s.y >= (inSheet ? TOP_MIN_SHEET : TOP_MIN) &&
        s.y <= window.innerHeight - BOTTOM_MIN &&
        s.x2 > 30 &&
        s.x1 < window.innerWidth - 30
      );
    };
    const visible = () =>
      grounds.map(surfaceOf).filter((s): s is Surface => s !== null && usable(s));
    const nearest = (list: Surface[], x: number, y: number) =>
      list.sort((a, b) => Math.hypot(clamp(x, a.x1, a.x2) - x, a.y - y) - Math.hypot(clamp(x, b.x1, b.x2) - x, b.y - y))[0];

    // ---- J and the ball ----------------------------------------------------------------------------
    const p = {
      x: 0,
      y: -40,
      vx: 0,
      vy: 0,
      dir: 1 as 1 | -1,
      on: undefined as Element | null | undefined, // null is the floor, undefined is mid-air
      from: undefined as Element | null | undefined, // the surface a hop took off from
      off: 0, // x from the left edge of the surface J stands on
      mode: "air" as Mode,
      t: 0,
      until: 0,
      pose: "stand" as FrameName,
      airPose: "jump" as FrameName,
      afterLanding: null as null | (() => void),
      spin: false,
      speed: 0,
      rot: 0,
      exit: 1 as 1 | -1,
      exiting: false, // sent off: walls don't bounce J back
    };
    const b = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      on: undefined as Element | null | undefined,
      off: 0,
      held: true,
      spin: 0,
      phase: 0,
    };
    let booked = false;
    let card: Card | null = null;
    let lastActive = performance.now();
    let night = kochiTime()[0] < NIGHT_UNTIL;
    let blinkAt = 0;
    let pokes: number[] = [];
    let cordPulls: number[] = [];
    let bulbCooldown = 0;

    const standing = () => p.on !== undefined;
    const standOn = (s: Surface, x: number) => {
      p.on = s.el;
      p.off = clamp(x, s.x1 + 8, s.x2 - 8) - s.x1;
      p.x = s.x1 + p.off;
      p.y = s.y;
      p.vx = p.vy = 0;
    };
    let touches = 0;
    const setMode = (mode: Mode, frames = 0) => {
      if (p.mode === "juggle" && mode !== "juggle") setCount(0);
      if (p.mode === "sleep" && mode !== "sleep") setMark(null);
      p.mode = mode;
      p.t = 0;
      p.until = frames;
    };
    const fall = (then: (() => void) | null = null) => {
      p.from = undefined;
      p.on = undefined;
      p.vx = 0;
      p.vy = 0;
      p.airPose = "jump";
      p.afterLanding = then;
      setMode("air");
    };
    /** A hop that lands on surface `s` near x, worked out so the arc ends there. */
    const jumpTo = (s: Surface, x: number, then: (() => void) | null = null) => {
      const tx = clamp(x, s.x1 + 10, s.x2 - 10);
      if (reduce) {
        standOn(s, tx);
        setMode("idle", SECOND);
        then?.();
        return;
      }
      const dx = tx - p.x;
      const dy = s.y - p.y;
      const frames = clamp(Math.abs(dx) / 5 + Math.abs(dy) / 9, 22, 46);
      p.from = p.on; // a hop down starts by moving down, so don't land straight back where it began
      p.on = undefined;
      p.vx = dx / frames;
      p.vy = (dy - 0.5 * G * frames * frames) / frames;
      p.dir = dx >= 0 ? 1 : -1;
      p.airPose = "jump";
      p.afterLanding = then;
      setMode("air");
    };
    /** J's surface scrolled away or vanished: fall, hop to another one, or wait on the bottom edge. */
    const leaveSurface = (s: Surface | null) => {
      if (s && s.el && s.y < (dialog?.contains(s.el) ? TOP_MIN_SHEET : TOP_MIN)) return fall();
      const options = visible().filter((o) => o.el !== p.on);
      if (options.length) return jumpTo(nearest(options, p.x, p.y), p.x);
      if (s && s.y > window.innerHeight - BOTTOM_MIN) return standOn(floor(), p.x);
      fall();
    };

    const footX = () => p.x + p.dir * 12;
    const dropBall = () => {
      if (!b.held) return;
      b.held = false;
      b.on = p.on;
      const s = p.on === undefined ? null : surfaceOf(p.on);
      b.off = s ? b.x - s.x1 : 0;
      b.vx = b.vy = 0;
    };
    const newBall = () => {
      b.held = true;
      b.vx = b.vy = 0;
      say(lines.newBall, 1600);
    };

    /** Picks J's next thing to do once the current one runs out. */
    const decide = () => {
      if (!b.held) return setMode("chase");
      const page = visible();
      if (p.on === null && page.length) return jumpTo(nearest(page, p.x, p.y), p.x);
      const r = Math.random();
      if (reduce) return setMode("idle", 3 * SECOND);
      const others = page.filter((s) => s.el !== p.on && Math.abs(s.y - p.y) < 420);
      if (r < 0.1 && others.length) {
        const s = others[Math.floor(Math.random() * others.length)];
        return jumpTo(s, rand(s.x1 + 20, s.x2 - 20));
      }
      if (r < 0.38) {
        b.phase = 0;
        touches = 0;
        return setMode("juggle", Math.round(rand(3.5, 6.5) * SECOND));
      }
      if (r < 0.75) {
        if (Math.random() < 0.4) p.dir = p.dir === 1 ? -1 : 1;
        return setMode("walk", Math.round(rand(2, 5) * SECOND));
      }
      setMode("idle", Math.round(rand(1, 3) * SECOND));
    };

    const celebrate = (pose: FrameName, frames: number) => {
      p.pose = pose;
      setMode("pose", frames);
    };

    // ---- Things visitors do ------------------------------------------------------------------------
    const activity = () => {
      lastActive = performance.now();
    };
    const wake = () => {
      flash(null);
      setMode("idle", SECOND);
      if (night && once("night")) say(lines.night(kochiTime()[1]), 3200);
      else if (once("woken")) say(lines.woken, 2000);
    };

    const poke = () => {
      activity();
      if (["gone", "leave", "enter", "roll", "hurt"].includes(p.mode)) return;
      if (p.mode === "sleep") return wake();
      const now = performance.now();
      pokes = [...pokes.filter((t) => now - t < 5000), now];
      if (pokes.length >= 3) {
        pokes = [];
        return dive();
      }
      playChirp(1 + pokes.length * 0.1);
      flash("!");
      if (pokes.length === 2) say(pick(lines.flinch), 1500);
      if (standing() && !reduce) {
        const then = p.mode === "chase" ? () => setMode("chase") : null;
        fall(then);
        p.vy = -3.6;
        p.airPose = "armsUp";
      }
    };

    // Too many pokes: J goes down rolling and clutching a leg, the ref shows you a card, and a second
    // yellow sends J off the pitch (and the page) for a while.
    const dive = () => {
      playWhistle();
      dropBall();
      flash(null);
      card = booked ? "red" : "yellow";
      p.rot = 0;
      // Mid-hop: go down as soon as J lands.
      if (!standing()) p.afterLanding = reduce ? hurt : () => setMode("roll");
      else if (reduce) hurt();
      else setMode("roll");
    };
    const hurt = () => {
      p.rot = 0;
      setMode("hurt", Math.round(1.8 * SECOND));
      setCard({ color: card ?? "yellow", id: ++seq });
      later(() => setCard(null), 1800);
      if (card === "red") {
        booked = false;
        say(lines.red, 3000);
      } else {
        booked = true;
        say(lines.yellow, 2600);
      }
    };

    const kick = (fromX: number) => {
      activity();
      if (p.mode === "gone") return;
      playKick();
      const away = fromX < b.x - 2 ? 1 : fromX > b.x + 2 ? -1 : p.dir;
      if (b.held) {
        b.held = false;
        b.x = footX();
      }
      b.on = undefined;
      b.vx = away * rand(4.2, 7);
      b.vy = -rand(6, 9.5);
      if (once("kicked")) say(lines.kicked, 2200);
      if (p.mode === "sleep") wake();
      if (["idle", "walk", "juggle"].includes(p.mode)) {
        flash("!");
        setMode("pose", 24);
        p.pose = "stand";
        later(() => {
          if (p.mode === "pose" || p.mode === "idle") setMode("chase");
        }, 420);
      }
    };

    api.current = { poke, kick, say };

    // ---- The loop ----------------------------------------------------------------------------------
    let frame = 0;
    let drawn = "";
    let drawnBall = -1;
    let below = false;
    let align = "";
    let raf = 0;

    const tick = () => {
      frame++;
      if (frame % 30 === 1) grounds = [...document.querySelectorAll("[data-ground]")];
      dialog = document.querySelector("dialog[open]");
      if (frame % (30 * SECOND) === 1) night = kochiTime()[0] < NIGHT_UNTIL;
      p.t++;
      const prevY = p.y;

      // Standing modes ride their surface, or react when it goes away.
      let cur: Surface | null = null;
      if (standing() && p.mode !== "gone") {
        const s = surfaceOf(p.on ?? null);
        if (!s || !usable(s)) leaveSurface(s);
        else {
          cur = s;
          if (!p.exiting) p.off = clamp(p.off, 8, Math.max(8, s.x2 - s.x1 - 8));
          p.x = s.x1 + p.off;
          p.y = s.y;
        }
      }

      // Dozing off when nobody's around: sooner at night in Kochi.
      const idleFor = performance.now() - lastActive;
      if (
        ["idle", "walk", "juggle"].includes(p.mode) &&
        b.held &&
        cur &&
        idleFor > (night ? 10_000 : 45_000)
      ) {
        setMode("sleep");
        flash("z");
      }

      let pose: FrameName = "stand";
      switch (p.mode) {
        case "idle":
          pose = performance.now() < blinkAt + 130 ? "blink" : "stand";
          if (performance.now() - blinkAt > rand(2500, 6000)) blinkAt = performance.now();
          if (--p.until <= 0) decide();
          break;
        case "walk":
          if (!cur) break;
          p.off += p.dir * 0.55;
          if (p.x <= cur.x1 + 10) p.dir = 1;
          if (p.x >= cur.x2 - 10) p.dir = -1;
          pose = Math.floor(p.t / 9) % 2 ? "run1" : "run2";
          if (--p.until <= 0) decide();
          break;
        case "juggle":
          pose = b.y > p.y - 5 ? "kick" : "stand";
          if (--p.until <= 0 && b.y > p.y - 2) setMode("idle", SECOND);
          break;
        case "chase": {
          if (b.held) {
            setMode("walk", 2 * SECOND);
            break;
          }
          const ballResting = b.on !== undefined && Math.abs(b.vx) < 0.6;
          if (cur && b.on !== undefined && b.on === p.on) {
            const gap = b.x - footX();
            if (Math.abs(gap) > 4) {
              p.dir = b.x >= p.x ? 1 : -1;
              p.off += p.dir * (reduce ? 999 : 1.5);
              p.off = clamp(p.off, 8, cur.x2 - cur.x1 - 8);
              pose = Math.floor(p.t / 6) % 2 ? "run1" : "run2";
            }
            if (Math.abs(b.x - footX()) <= 6 || reduce) {
              b.held = true;
              setMode("walk", 2 * SECOND);
            }
          } else if (cur && ballResting) {
            const s = surfaceOf(b.on ?? null);
            if (s && usable(s)) jumpTo(s, b.x - p.dir * 12, () => setMode("chase"));
          } else if (cur && b.on === undefined) {
            p.dir = b.x >= p.x ? 1 : -1; // watch it fly
          }
          if (p.t > 12 * SECOND) newBall();
          break;
        }
        case "air": {
          if (p.spin && p.t % 8 === 0) p.dir = p.dir === 1 ? -1 : 1;
          p.vy += G;
          p.x += p.vx;
          p.y += p.vy;
          if (!p.exiting && (p.x < 10 || p.x > window.innerWidth - 10)) p.vx = -p.vx * 0.5;
          p.x = clamp(p.x, -40, window.innerWidth + 40);
          pose = p.airPose;
          // Missed everything (only possible right at the screen edges): off the pitch, or back on the floor.
          if (p.y > window.innerHeight + 40) {
            if (p.exiting) setMode("gone", 20 * SECOND);
            else {
              standOn(floor(), p.x);
              setMode("idle", SECOND);
            }
            break;
          }
          if (p.vy > 0) {
            const landing = [...visible(), floor()].find((s) => {
              if (s.el === p.from && p.t < 12) return false;
              const before = lastY.get(s.el) ?? s.y;
              return prevY <= before + 1 && p.y >= s.y && p.x >= s.x1 - 2 && p.x <= s.x2 + 2;
            });
            if (landing) {
              p.from = undefined;
              standOn(landing, p.x);
              p.spin = false;
              const then = p.afterLanding;
              p.afterLanding = null;
              if (then) then();
              else setMode(b.held ? "idle" : "chase", 20);
            }
          }
          break;
        }
        case "roll":
          if (p.t % 5 === 0) p.rot++;
          p.off += p.dir * 1.3;
          pose = "stand";
          if (p.rot >= 8) hurt();
          break;
        case "hurt":
          pose = "hurt";
          if (--p.until <= 0) {
            if (card === "red") {
              p.exit = p.x < window.innerWidth / 2 ? -1 : 1;
              p.dir = p.exit;
              p.exiting = true;
              setMode("leave");
            } else {
              setMode("chase");
            }
            card = null;
          }
          break;
        case "pose":
          pose = p.pose;
          if (--p.until <= 0) setMode(b.held ? "idle" : "chase", SECOND);
          break;
        case "slide":
          pose = "slide";
          p.off += p.dir * p.speed;
          p.speed *= 0.94;
          if (--p.until <= 0) setMode("idle", SECOND);
          break;
        case "sleep":
          pose = "sleep";
          break;
        case "leave":
          // Walking off the pitch: straight off the edge of whatever it's on, down to the floor, out of view.
          pose = Math.floor(p.t / 10) % 2 ? "run1" : "run2";
          if (cur) {
            p.off += p.exit * 0.9;
            // Off the end of a page surface: drop to the floor and keep walking. The floor runs off screen.
            if (cur.el && (p.off < -4 || p.off > cur.x2 - cur.x1 + 4)) {
              fall(() => setMode("leave"));
              p.vx = p.exit * 0.9;
            }
          }
          if (p.x < -24 || p.x > window.innerWidth + 24) setMode("gone", 20 * SECOND);
          break;
        case "gone":
          if (--p.until <= 0) {
            p.on = null;
            p.x = p.exit < 0 ? -20 : window.innerWidth + 20;
            p.off = p.x - floor().x1;
            p.dir = p.exit < 0 ? 1 : -1;
            b.held = true;
            setMode("enter");
          }
          break;
        case "enter":
          pose = Math.floor(p.t / 7) % 2 ? "run1" : "run2";
          p.off += p.dir * 1.4;
          p.x = floor().x1 + p.off;
          p.y = floor().y;
          if (p.x > 70 && p.x < window.innerWidth - 70) {
            p.exiting = false;
            say(lines.back, 2400);
            standOn(floor(), p.x);
            setMode("idle", SECOND);
          }
          break;
      }

      // ---- The ball ----
      if (b.held) {
        if (p.mode === "juggle") {
          b.phase += 0.075;
          const up = Math.abs(Math.sin(b.phase));
          if (Math.floor(b.phase / Math.PI) !== touches) {
            touches = Math.floor(b.phase / Math.PI);
            setCount(touches);
          }
          b.x = footX();
          b.y = p.y - up * 26;
        } else if (p.mode === "sleep") {
          b.x = p.x - p.dir * 16;
          b.y = p.y;
        } else {
          b.x = footX() + (p.mode === "walk" && Math.floor(p.t / 9) % 2 ? p.dir * 2 : 0);
          b.y = p.y;
        }
        if (p.mode === "walk" || p.mode === "chase") b.spin += 0.55;
      } else if (b.on !== undefined) {
        const s = surfaceOf(b.on);
        if (!s || !usable(s)) {
          if (s && s.y > window.innerHeight - BOTTOM_MIN) {
            b.on = null;
            b.off = b.x - floor().x1;
          } else {
            b.on = undefined;
            b.vy = 0;
          }
        } else {
          b.off += b.vx;
          b.vx *= 0.97;
          if (Math.abs(b.vx) < 0.05) b.vx = 0;
          b.spin += Math.abs(b.vx);
          b.x = s.x1 + b.off;
          b.y = s.y;
          if (b.x < s.x1 - 2 || b.x > s.x2 + 2) b.on = undefined; // rolled off the edge
        }
      } else {
        const prevBallY = b.y;
        b.vy += G;
        b.x += b.vx;
        b.y += b.vy;
        b.spin += Math.abs(b.vx) + 0.3;
        if (b.x < 6 || b.x > window.innerWidth - 6) {
          b.vx = -b.vx * 0.7;
          b.x = clamp(b.x, 6, window.innerWidth - 6);
        }
        if (b.y < 14 && b.vy < 0) b.vy = -b.vy * 0.4;
        if (b.vy > 0) {
          const landing = [...visible(), floor()].find((s) => {
            const before = lastY.get(s.el) ?? s.y;
            return prevBallY <= before + 1 && b.y >= s.y && b.x >= s.x1 && b.x <= s.x2;
          });
          if (landing) {
            b.y = landing.y;
            if (b.vy > 2.4) {
              b.vy = -b.vy * 0.5;
              b.vx *= 0.85;
              playKick(0.35);
            } else {
              b.on = landing.el;
              b.off = b.x - landing.x1;
              b.vy = 0;
            }
          }
        }
        // Kicked into the pull cord's bulb: the lights flip.
        const bulb = document.querySelector("button[aria-label*='lights']");
        if (bulb && performance.now() > bulbCooldown) {
          const r = bulb.getBoundingClientRect();
          if (b.x > r.left - 6 && b.x < r.right + 6 && b.y > r.top - 4 && b.y < r.bottom + 10) {
            bulbCooldown = performance.now() + 3000;
            hitBulb();
            b.vx = -b.vx * 0.6;
            b.vy = Math.abs(b.vy) * 0.3;
            say(lines.bulb, 2000);
          }
        }
      }

      // Remember where every surface was, to catch things landing on a surface that scrolled this frame.
      lastY.clear();
      for (const s of [...visible(), floor()]) lastY.set(s.el, s.y);

      // ---- Draw ----
      const hidden = p.mode === "gone";
      me.style.visibility = hidden ? "hidden" : "";
      me.style.transform = `translate3d(${(p.x - (BOX * S) / 2).toFixed(1)}px, ${(p.y - (BOX - 1) * S).toFixed(1)}px, 0)`;
      canvas.style.rotate = p.mode === "roll" ? `${p.dir * p.rot * 90}deg` : "";
      ballEl.style.transform = `translate3d(${(b.x - 11).toFixed(1)}px, ${(b.y - 22 + S).toFixed(1)}px, 0)`;

      const dark = document.documentElement.classList.contains("dark");
      const key = `${pose}${p.dir}${dark}`;
      if (key !== drawn) {
        drawn = key;
        drawFrame(ctx, FRAMES[pose], { size: BOX, scale: S * dpr, flip: p.dir < 0, dark });
      }
      const ballFrame = Math.floor(b.spin / 7) % 2;
      if (ballFrame !== drawnBall || key !== drawn) {
        drawnBall = ballFrame;
        drawFrame(bctx, BALL[ballFrame], { size: BALL_BOX, scale: S * dpr, flip: false, dark });
      }

      const nextBelow = p.y < 110;
      if (nextBelow !== below) {
        below = nextBelow;
        me.toggleAttribute("data-below", below);
      }
      const nextAlign = p.x < 110 ? "left" : p.x > window.innerWidth - 110 ? "right" : "";
      if (nextAlign !== align) {
        align = nextAlign;
        if (align) me.dataset.align = align;
        else delete me.dataset.align;
      }
      raf = requestAnimationFrame(tick);
    };

    // Drop in from above onto something on screen.
    grounds = [...document.querySelectorAll("[data-ground]")];
    const start = visible().filter((s) => s.x2 - s.x1 > 100);
    const first = start[Math.floor(Math.random() * start.length)];
    p.x = first ? rand(first.x1 + 30, first.x2 - 30) : window.innerWidth - 60;
    if (reduce) standOn(first ?? floor(), p.x);
    raf = requestAnimationFrame(tick);

    const onActivity = () => activity();
    window.addEventListener("pointermove", onActivity, { passive: true });
    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("touchstart", onActivity, { passive: true });

    // What happens elsewhere on the site.
    const unsubscribe = onMascot((e) => {
      activity();
      if (p.mode === "gone" || p.mode === "enter") return;
      if (p.mode === "sleep") wake();
      const free = ["idle", "walk", "juggle", "pose"].includes(p.mode) && standing();
      if (e.type === "cord") {
        const now = performance.now();
        cordPulls = [...cordPulls.filter((t) => now - t < 5000), now];
        if (cordPulls.length >= 3) say(pick(lines.cordSpam), 2400);
        else if (e.dark) {
          say(pick(lines.dark), 2200);
          flash("!");
        } else {
          say(pick(lines.light), 1800);
          if (free) celebrate("handsOnHead", 50);
        }
      } else if (e.type === "project") {
        say(lines.project[e.slug] ?? lines.projectOther, 3000);
        later(raise, 120);
      } else if (e.type === "email") {
        say(lines.email, 2400);
        if (free && !reduce) {
          p.speed = 2.6;
          setMode("slide", 40);
        }
      } else if (e.type === "c4") {
        if (e.result === "win") {
          playChirp(1.2, 2);
          say(lines.c4Win(e.level), 3000);
          if (free && !reduce) {
            fall(() => celebrate("siuuu", 80));
            p.vy = -7;
            p.spin = true;
            p.airPose = "armsUp";
          }
        } else if (e.result === "lose") {
          say(pick(lines.c4Lose), 2400);
          if (free) celebrate("handsOnHead", 100);
        } else {
          say(lines.c4Draw, 2400);
        }
      }
    });

    // First visit: hello, then the dare.
    later(() => {
      if (!once("hello")) return;
      playChirp(1, 2);
      say(lines.hello, 2400);
      later(() => say(lines.dare(touch), 3400), 2600);
    }, 1600);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      unsubscribe();
      window.removeEventListener("pointermove", onActivity);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("touchstart", onActivity);
      api.current = null;
    };
  }, []);

  // When John's online (and this isn't John looking at his own site), J mentions it once.
  const status = useC4Status();
  const johnHere = status.live && status.online && !status.owner;
  useEffect(() => {
    if (!johnHere) return;
    const id = setTimeout(() => {
      if (once("online")) api.current?.say(lines.online, 3800);
    }, 12_000);
    return () => clearTimeout(id);
  }, [johnHere]);

  return (
    <div
      ref={root}
      popover="manual"
      className="pointer-events-none fixed z-[110] overflow-visible border-0 bg-transparent p-0 text-inherit"
      style={{ inset: "auto", top: 0, left: 0, margin: 0 }}
    >
      <button
        ref={ball}
        type="button"
        data-no-tick
        aria-label="Kick J's ball"
        onClick={(e) => api.current?.kick(e.detail === 0 ? -1 : e.clientX)}
        className="pointer-events-auto absolute top-0 left-0 flex size-[22px] cursor-pointer touch-manipulation items-end justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
      >
        <canvas ref={ballSprite} aria-hidden style={{ width: BALL_BOX * S, height: BALL_BOX * S }} />
      </button>
      <div ref={body} className="absolute top-0 left-0" style={{ width: BOX * S, height: BOX * S }}>
        <canvas ref={sprite} aria-hidden className="block" style={{ width: BOX * S, height: BOX * S }} />
        <button
          type="button"
          data-no-tick
          aria-label="J, the site's pixel footballer. Press to poke"
          onClick={() => api.current?.poke()}
          className="pointer-events-auto absolute top-0 left-[7px] h-[30px] w-[18px] cursor-pointer touch-manipulation rounded-md outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
        />
        {speech && (
          <span
            key={speech.id}
            aria-hidden
            className="mascot-bubble blur-in pointer-events-none w-max max-w-[220px] rounded-2xl bg-neutral-900 px-3 py-1.5 text-xs leading-4 font-medium text-white shadow-[0_6px_20px_-8px_rgb(0_0_0/0.5)] dark:bg-neutral-100 dark:text-neutral-900"
          >
            {speech.text}
          </span>
        )}
        {card && (
          <span
            key={card.id}
            aria-hidden
            className={`mascot-pop absolute -top-4 left-[22px] h-[13px] w-[9px] rounded-[1px] shadow-[0_0_0_1.5px_#262626] ${
              card.color === "red" ? "bg-[#ef4444]" : "bg-[#facc15]"
            }`}
          />
        )}
        {mark && !speech && (
          <span
            aria-hidden
            className={`absolute inset-x-0 -top-3 text-center font-mono text-[11px] leading-none font-bold text-neutral-500 ${
              mark === "z" ? "mascot-z" : "mascot-pop"
            }`}
          >
            {mark}
          </span>
        )}
        {count >= 3 && !speech && (
          <span
            aria-hidden
            className="absolute inset-x-0 -top-3 text-center font-mono text-[10px] leading-none tabular-nums text-neutral-400"
          >
            {count}
          </span>
        )}
      </div>
    </div>
  );
}
