// Pixel art for J, the site's footballer, facing right (frames are mirrored to face left).
// One character per pixel, "." is empty. Every frame is drawn bottom-centred, feet on the ground row.

const COLORS: Record<string, string> = {
  h: "#1c1917", // hair
  f: "#b97a4a", // skin
  e: "#1c1917", // eye
  j: "#7dd3fc", // Argentina sky blue; every other column is a white stripe
  w: "#111827", // shorts
  o: "#f5f5f5", // socks
  x: "#171717", // boots
  W: "#fafafa", // ball
  K: "#262626",
  O: "#737373",
};
const STRIPE = "#ffffff";

const head = ["...hhhh...", "..hhhhhh..", "..hhffff..", "..hfffef..", "...ffff..."];
const torso = ["...jjjj...", "..jjjjjj..", ".fjjjjjjf.", ".fjjjjjjf."];
const shorts = ["...wwww...", "...wwww..."];
const legs = [...shorts, "...o..o...", "...o..o...", "...xx.xx.."];
const armsUp = ["f..hhhh..f", "f.hhhhhh.f", "f.hhffff.f", "f.hfffef.f", "f..ffff..f", "fjjjjjjjjf", "..jjjjjj..", "..jjjjjj..", "..jjjjjj.."];

export const FRAMES = {
  stand: [...head, ...torso, ...legs],
  blink: [...head.slice(0, 3), "..hfffff..", head[4], ...torso, ...legs],
  run1: [...head, ...torso, ...shorts, "..o...o...", ".o.....o..", "xx.....xx."],
  run2: [...head, ...torso, ...shorts, "....oo....", "....oo....", "....xxx..."],
  kick: [...head, ...torso, ...shorts, "...o..o...", "...o...oo.", "..xx....xx"],
  jump: [...armsUp, ...shorts, "..oo..oo..", "..xx..xx.."],
  armsUp: [...armsUp, ...legs],
  siuuu: [...head, "...jjjj...", "..jjjjjj..", ".fjjjjjjf.", "f.jjjjjj.f", "...wwww...", "..ww..ww..", ".o......o.", ".o......o.", "xx......xx"],
  handsOnHead: ["..ffhhff..", ".fhhhhhhf.", "f.hhffff.f", "f.hfffef.f", ".f.ffff.f.", "..fjjjjf..", "..jjjjjj..", "..jjjjjj..", "..jjjjjj..", ...legs],
  slide: ["....hhhh....", "...hhhhhh...", "...hhffff...", "...hfffef...", "....ffff....", "ff..jjjj..ff", ".ffjjjjjjff.", "...jjjjjj...", "...wwwwww...", "xxoooo..ww.."],
  hurt: ["..........x...", "..........o...", ".hh.....ffo...", "hhfejjjjjwwooo", "hhffjjjjjwwoox"],
  sleep: ["hhffjjjjjwwooo", "hhffjjjjjwwoxx"],
} satisfies Record<string, string[]>;

export type FrameName = keyof typeof FRAMES;

export const BALL = [
  [".OOO.", "OWKWO", "OKWKO", "OWKWO", ".OOO."],
  [".OOO.", "OKWKO", "OWKWO", "OKWKO", ".OOO."],
];

/**
 * Draws a frame bottom-centred on a canvas `size` pixels square (in sprite pixels), with a one-pixel
 * outline so J reads on both themes. `scale` is CSS pixels per sprite pixel times the device pixel ratio.
 */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  { size, scale, flip, dark }: { size: number; scale: number; flip: boolean; dark: boolean },
) {
  ctx.clearRect(0, 0, size * scale, size * scale);
  const w = rows[0].length;
  const h = rows.length;
  const left = Math.floor((size - w) / 2);
  const top = size - 1 - h; // the bottom row is left for the outline under the boots
  const solid = (r: number, c: number) => r >= 0 && r < h && c >= 0 && c < w && rows[r][c] !== ".";
  const at = (c: number) => left + (flip ? w - 1 - c : c);

  ctx.fillStyle = dark ? "#404040" : "#262626";
  for (let r = -1; r <= h; r++) {
    for (let c = -1; c <= w; c++) {
      if (solid(r, c)) continue;
      if (solid(r - 1, c) || solid(r + 1, c) || solid(r, c - 1) || solid(r, c + 1)) {
        ctx.fillRect(at(c) * scale, (top + r) * scale, scale, scale);
      }
    }
  }
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const ch = rows[r][c];
      if (ch === ".") continue;
      ctx.fillStyle = ch === "j" && c % 2 === 1 ? STRIPE : COLORS[ch];
      ctx.fillRect(at(c) * scale, (top + r) * scale, scale, scale);
    }
  }
}
