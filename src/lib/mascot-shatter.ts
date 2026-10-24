// Breaks the words a ball hits into letters that scatter, bounce off the page and fly back home.
//
// Nothing in the page's own DOM changes (React owns it). The word is covered by a patch in its background
// colour, and every letter is a positioned copy of the real glyph (same font, same spot) in a fixed layer
// above the page. The copies fall, bounce on the same surfaces J stands on, then glide back; when the last
// one lands the layer fades out and the real word is underneath, exactly where it was.

export type Ground = { x1: number; x2: number; y: number };

type Piece = {
  el: HTMLSpanElement;
  w: number;
  h: number;
  hx: number; // home: where the real glyph sits
  hy: number;
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  vr: number;
  delay: number; // frames after the others before this one heads home
  homing: boolean;
  t: number;
  fx: number; // where it was when it set off home
  fy: number;
  fr: number;
  done: boolean;
};

type Burst = {
  wrap: HTMLDivElement;
  pieces: Piece[];
  keys: string[];
  age: number;
  scrollY: number;
  dark: boolean;
};

type Word = { node: Text; start: number; end: number };

const GRAVITY = 0.5;
const HOME_AT = 80; // frames of flying about before the letters head home
const HOME_FRAMES = 26; // how long each letter takes to get there
const MAX_LETTERS = 30;
const MAX_BURSTS = 2;
const COOLDOWN = 380; // ms between hits

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const isSpace = (c: string) => /\s/.test(c);

type CaretDocument = Document & {
  caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  caretRangeFromPoint?: (x: number, y: number) => Range | null;
};

function caretAt(x: number, y: number): { node: Node; offset: number } | null {
  const doc = document as CaretDocument;
  if (doc.caretPositionFromPoint) {
    const c = doc.caretPositionFromPoint(x, y);
    return c ? { node: c.offsetNode, offset: c.offset } : null;
  }
  if (doc.caretRangeFromPoint) {
    const r = doc.caretRangeFromPoint(x, y);
    return r ? { node: r.startContainer, offset: r.startOffset } : null;
  }
  return null;
}

function rangeOf(node: Text, start: number, end: number) {
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  return range;
}

/** The word around a character offset, as [start, end), or null when it sits in whitespace. */
function wordBounds(text: string, offset: number): [number, number] | null {
  let i = offset;
  if (i >= text.length || isSpace(text[i])) i--;
  if (i < 0 || isSpace(text[i])) return null;
  let start = i;
  while (start > 0 && !isSpace(text[start - 1])) start--;
  let end = i + 1;
  while (end < text.length && !isSpace(text[end])) end++;
  return [start, end];
}

/** The colour the text sits on, or null when it sits on an image or gradient (we can't patch those). */
function solidBackground(from: Element): string | null {
  for (let el: Element | null = from; el; el = el.parentElement) {
    const cs = getComputedStyle(el);
    if (cs.backgroundImage !== "none") return null;
    const bg = cs.backgroundColor;
    if (!bg || bg === "transparent" || bg === "rgba(0, 0, 0, 0)") continue;
    if (bg.startsWith("color-mix(")) return null;
    const alpha = bg.match(/\/\s*([\d.]+)(%?)\s*\)$/) ?? bg.match(/^rgba\([^)]*,\s*([\d.]+)\s*\)$/);
    const a = alpha ? (alpha[2] === "%" ? Number(alpha[1]) / 100 : Number(alpha[1])) : 1;
    if (a > 0.95) return bg;
  }
  return getComputedStyle(document.body).backgroundColor;
}

export function createShatter(host: HTMLElement) {
  const bursts: Burst[] = [];
  const broken = new Set<string>();
  const ids = new WeakMap<Node, number>();
  let nextId = 1;
  let lastHit = 0;

  const keyOf = (w: Word) => {
    let id = ids.get(w.node);
    if (!id) ids.set(w.node, (id = nextId++));
    return `${id}:${w.start}`;
  };

  /** The word under a point, if the point is really on its glyphs (not just on the line it's in). */
  function wordAt(x: number, y: number): Word | null {
    const caret = caretAt(x, y);
    if (!caret || caret.node.nodeType !== Node.TEXT_NODE) return null;
    const node = caret.node as Text;
    const parent = node.parentElement;
    if (!parent || !parent.closest("main") || parent.closest("[popover], dialog, [data-mascot-fx], canvas")) return null;
    const cs = getComputedStyle(parent);
    if (cs.visibility !== "visible" || Number(cs.opacity) < 0.5) return null;
    const bounds = wordBounds(node.data, caret.offset);
    if (!bounds) return null;
    const rects = Array.from(rangeOf(node, bounds[0], bounds[1]).getClientRects());
    const on = rects.some((r) => x >= r.left - 3 && x <= r.right + 3 && y >= r.top - 3 && y <= r.bottom + 3);
    return on ? { node, start: bounds[0], end: bounds[1] } : null;
  }

  /** The words either side of a hit that are close enough to go down with it. */
  function neighbours(hit: Word, x: number, y: number): Word[] {
    const text = hit.node.data;
    const out: Word[] = [];
    const near = (w: Word) => {
      const r = rangeOf(w.node, w.start, w.end).getBoundingClientRect();
      return Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y) < 72;
    };
    let i = hit.start - 1;
    while (i >= 0 && isSpace(text[i])) i--;
    const before = i >= 0 ? wordBounds(text, i) : null;
    if (before) out.push({ node: hit.node, start: before[0], end: before[1] });
    i = hit.end;
    while (i < text.length && isSpace(text[i])) i++;
    const after = i < text.length ? wordBounds(text, i) : null;
    if (after) out.push({ node: hit.node, start: after[0], end: after[1] });
    return out.filter(near);
  }

  /** Breaks the word at (x, y), if there is one. Returns the broken words, or null when nothing broke. */
  function hit(x: number, y: number, vx: number, vy: number): string[] | null {
    const now = performance.now();
    if (now - lastHit < COOLDOWN || bursts.length >= MAX_BURSTS) return null;
    const first = wordAt(x, y);
    if (!first || broken.has(keyOf(first))) return null;
    const parent = first.node.parentElement as Element;
    const bg = solidBackground(parent);
    if (!bg) return null;

    const words = [first, ...neighbours(first, x, y).filter((w) => !broken.has(keyOf(w)))];
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:absolute;inset:0;transition:opacity 180ms;";
    const patches: HTMLDivElement[] = [];
    const pieces: Piece[] = [];
    const keys: string[] = [];
    const spoken: string[] = [];

    for (const word of words) {
      if (pieces.length >= MAX_LETTERS) break;
      const cs = getComputedStyle(word.node.parentElement as Element);
      const range = rangeOf(word.node, word.start, word.end);
      for (const r of range.getClientRects()) {
        const patch = document.createElement("div");
        patch.style.cssText = `position:absolute;left:${r.left - 1.5}px;top:${r.top - 0.5}px;width:${r.width + 3}px;height:${r.height + 1}px;background:${bg};`;
        patches.push(patch);
      }
      for (let i = word.start; i < word.end && pieces.length < MAX_LETTERS; i++) {
        const r = rangeOf(word.node, i, i + 1).getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const el = document.createElement("span");
        el.textContent = word.node.data[i];
        el.style.cssText = [
          "position:absolute;left:0;top:0;white-space:pre;pointer-events:none;will-change:transform",
          `width:${r.width}px;height:${r.height}px;line-height:${r.height}px`,
          `font-family:${cs.fontFamily};font-size:${cs.fontSize};font-weight:${cs.fontWeight};font-style:${cs.fontStyle}`,
          `letter-spacing:${cs.letterSpacing};font-feature-settings:${cs.fontFeatureSettings}`,
          `font-variant-numeric:${cs.fontVariantNumeric};text-transform:${cs.textTransform};color:${cs.color}`,
        ].join(";");
        el.style.transform = `translate(${r.left}px,${r.top}px)`; // exactly over the real glyph until it moves
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        let dx = cx - x;
        let dy = cy - y;
        const len = Math.hypot(dx, dy) || 1;
        dx /= len;
        dy /= len;
        const speed = rand(2.2, 5.4);
        pieces.push({
          el,
          w: r.width,
          h: r.height,
          hx: r.left,
          hy: r.top,
          x: r.left,
          y: r.top,
          r: 0,
          vx: dx * speed + vx * 0.28,
          vy: dy * speed + vy * 0.18 - rand(2.4, 5),
          vr: rand(-0.34, 0.34),
          delay: Math.floor(rand(0, 20)),
          homing: false,
          t: 0,
          fx: 0,
          fy: 0,
          fr: 0,
          done: false,
        });
      }
      keys.push(keyOf(word));
      spoken.push(word.node.data.slice(word.start, word.end));
    }
    if (!pieces.length) return null;

    keys.forEach((k) => broken.add(k));
    patches.forEach((p) => wrap.appendChild(p));
    pieces.forEach((p) => wrap.appendChild(p.el));
    host.appendChild(wrap);
    bursts.push({
      wrap,
      pieces,
      keys,
      age: 0,
      scrollY: window.scrollY,
      dark: document.documentElement.classList.contains("dark"),
    });
    lastHit = now;
    return spoken;
  }

  function dispose(burst: Burst) {
    burst.keys.forEach((k) => broken.delete(k));
    burst.wrap.style.opacity = "0";
    setTimeout(() => burst.wrap.remove(), 220);
  }

  function advance(p: Piece, age: number, grounds: Ground[]) {
    if (!p.homing) {
      p.vy += GRAVITY;
      p.vx *= 0.996;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      if (p.x < 0 || p.x + p.w > window.innerWidth) {
        p.vx *= -0.5;
        p.x = clamp(p.x, 0, window.innerWidth - p.w);
      }
      if (p.vy > 0) {
        const bottom = p.y + p.h;
        const was = bottom - p.vy;
        for (const g of grounds) {
          if (was <= g.y + 1 && bottom >= g.y && p.x + p.w > g.x1 && p.x < g.x2) {
            p.y = g.y - p.h;
            if (p.vy > 2.2) {
              p.vy *= -0.4;
              p.vx *= 0.78;
              p.vr *= 0.6;
            } else {
              p.vy = 0;
              p.vx *= 0.55;
              p.vr *= 0.5;
            }
            break;
          }
        }
      }
      if (age >= HOME_AT + p.delay) {
        p.homing = true;
        p.t = 0;
        p.fx = p.x;
        p.fy = p.y;
        // Unwind to the nearest whole turn so it doesn't spin back the long way.
        p.fr = ((((p.r + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
      }
    } else {
      p.t++;
      const k = Math.min(1, p.t / HOME_FRAMES);
      const e = 1 - Math.pow(1 - k, 3);
      p.x = p.fx + (p.hx - p.fx) * e;
      p.y = p.fy + (p.hy - p.fy) * e - Math.sin(k * Math.PI) * 16;
      p.r = p.fr * (1 - e);
      if (k >= 1) {
        p.x = p.hx;
        p.y = p.hy;
        p.r = 0;
        p.done = true;
      }
    }
    p.el.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) rotate(${p.r.toFixed(3)}rad)`;
  }

  /** Moves every letter one frame. `stop` ends everything at once (a project sheet opened, say). */
  function step(grounds: Ground[], stop = false) {
    const dark = document.documentElement.classList.contains("dark");
    for (let i = bursts.length - 1; i >= 0; i--) {
      const burst = bursts[i];
      burst.age++;
      if (stop || Math.abs(window.scrollY - burst.scrollY) > 24 || dark !== burst.dark) {
        dispose(burst);
        bursts.splice(i, 1);
        continue;
      }
      let done = true;
      for (const p of burst.pieces) {
        if (!p.done) advance(p, burst.age, grounds);
        if (!p.done) done = false;
      }
      if (done) {
        dispose(burst);
        bursts.splice(i, 1);
      }
    }
  }

  function clear() {
    bursts.splice(0).forEach((b) => b.wrap.remove());
    broken.clear();
  }

  return {
    hit,
    step,
    clear,
    get active() {
      return bursts.length > 0;
    },
  };
}
