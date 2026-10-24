"use client";

import { useSyncExternalStore } from "react";

// Tiny UI sound engine: a soft synthesized tick, no audio files.

const KEY = "sound";
const listeners = new Set<() => void>();
let ctx: AudioContext | null = null;

function read(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  listeners.forEach((l) => l());
}

export function useSoundEnabled() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => true,
  );
}

export function playTick(pitch = 1) {
  if (typeof window === "undefined" || !read()) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1400 * pitch, t);
    osc.frequency.exponentialRampToValueAtTime(500 * pitch, t + 0.04);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.05, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.07);
  } catch {}
}

/** J's voice: short rising chirps. One note for a poke, two for something nice. */
export function playChirp(pitch = 1, notes = 1) {
  if (typeof window === "undefined" || !read()) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    for (let i = 0; i < notes; i++) {
      const t = ctx.currentTime + i * 0.09;
      const p = pitch * (1 + i * 0.25);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(520 * p, t);
      osc.frequency.exponentialRampToValueAtTime(980 * p, t + 0.07);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.06, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  } catch {}
}

/** A referee's whistle: a high tone with a fast pea trill, two short blasts. */
export function playWhistle() {
  if (typeof window === "undefined" || !read()) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    [0, 0.22].forEach((at, i) => {
      const t = ctx!.currentTime + at;
      const length = i ? 0.32 : 0.14;
      const osc = ctx!.createOscillator();
      const trill = ctx!.createOscillator();
      const depth = ctx!.createGain();
      const gain = ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(2900, t);
      trill.type = "square";
      trill.frequency.setValueAtTime(34, t);
      depth.gain.setValueAtTime(140, t);
      trill.connect(depth).connect(osc.frequency);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.035, t + 0.01);
      gain.gain.setValueAtTime(0.035, t + length - 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(t);
      trill.start(t);
      osc.stop(t + length + 0.01);
      trill.stop(t + length + 0.01);
    });
  } catch {}
}

/** A ball being kicked: a short low thump. Quieter for bounces. */
export function playKick(volume = 1) {
  if (typeof window === "undefined" || !read()) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.09);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12 * volume, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  } catch {}
}

/** A light-switch click: a short low thunk with a bright snap on top. Pulling for dark sounds a touch lower. */
export function playSwitch(toDark: boolean) {
  if (typeof window === "undefined" || !read()) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    const pitch = toDark ? 0.8 : 1;
    const tone = (type: OscillatorType, from: number, to: number, peak: number, length: number) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from * pitch, t);
      osc.frequency.exponentialRampToValueAtTime(to * pitch, t + length);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(peak, t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(t);
      osc.stop(t + length + 0.01);
    };
    tone("triangle", 220, 70, 0.09, 0.07); // the thunk
    tone("square", 2600, 900, 0.025, 0.025); // the snap
  } catch {}
}
