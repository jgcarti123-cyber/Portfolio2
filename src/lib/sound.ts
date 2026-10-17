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
