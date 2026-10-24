"use client";

import { profile } from "@/data/site";

// J is the site's pixel footballer. Other components tell J what happened through this tiny event bus,
// and every line J says lives here so the voice stays in one place: lowercase, dry, one sentence at most.

export type MascotEvent =
  | { type: "cord"; dark: boolean }
  | { type: "project"; slug: string }
  | { type: "email" }
  | { type: "c4"; result: "win" | "lose" | "draw"; level: string };

const EVENT = "mascot";
const BULB = "mascot:bulb";

export function tellMascot(event: MascotEvent) {
  window.dispatchEvent(new CustomEvent<MascotEvent>(EVENT, { detail: event }));
}

export function onMascot(cb: (event: MascotEvent) => void) {
  const listener = (e: Event) => cb((e as CustomEvent<MascotEvent>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

/** The ball hit the pull cord's bulb. The cord listens and flips the lights. */
export function hitBulb() {
  window.dispatchEvent(new Event(BULB));
}

export function onBulbHit(cb: () => void) {
  window.addEventListener(BULB, cb);
  return () => window.removeEventListener(BULB, cb);
}

export const lines = {
  hello: "hey, i'm j.",
  dare: (touch: boolean) => (touch ? "tap the ball. i dare you." : "click the ball. i dare you."),
  flinch: ["oi", "careful"],
  yellow: "yellow card. that's on you.",
  red: "that's a red. i'm getting subbed off.",
  back: "back from the physio.",
  woken: "i'm up. i'm up.",
  night: (time: string) => `it's ${time} in kochi. i was asleep.`,
  kicked: "oi, that's my ball.",
  bulb: "nice shot.",
  newBall: "new ball.",
  dark: ["who turned off the floodlights", "lights out. can't see the ball"],
  light: ["my eyes", "too bright"],
  cordSpam: ["it's a light switch, not a fidget toy", "pick one"],
  email: "copied. go say hi.",
  online: "john's online right now. challenge him to connect 4.",
  c4Lose: ["unlucky.", "the bot says gg."],
  c4Draw: "a draw. very diplomatic.",
  c4Win: (level: string) =>
    level === "hard" ? "you beat hard mode. screenshot that." : `you beat the ${level} bot. respect.`,
  project: {
    aiva: "the big one. 25+ engineers use it.",
    "prim-pets": "200+ vet docs. it knows more about dogs than i do.",
    "swiggy-agent": "fills your cart, never checks out. smart.",
    "hil-runner": "tests a car from anywhere. wild.",
    "docs-rag": "reads 300 docs so you don't have to.",
    "yaml-generator": "replaced a vendor tool. nobody cried.",
  } as Record<string, string>,
  projectOther: "good pick.",
};

/** A random line that isn't the one picked last time from the same list. */
const lastPick = new Map<readonly string[], string>();
export function pick(list: readonly string[]) {
  const options = list.length > 1 ? list.filter((l) => l !== lastPick.get(list)) : list;
  const line = options[Math.floor(Math.random() * options.length)];
  lastPick.set(list, line);
  return line;
}

/** True the first time it's called with a key during a visit. */
export function once(key: string) {
  try {
    const seen = sessionStorage.getItem(`mascot-${key}`);
    sessionStorage.setItem(`mascot-${key}`, "1");
    return !seen;
  } catch {
    return true;
  }
}

/** John's local hour and time, e.g. [3, "3:12 am"]. J sleeps when it's night in Kochi. */
export function kochiTime(): [number, string] {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: profile.timeZone,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hour12 = Number(get("hour"));
  const pm = get("dayPeriod").toLowerCase() === "pm";
  const hour = (hour12 % 12) + (pm ? 12 : 0);
  return [hour, `${get("hour")}:${get("minute")} ${pm ? "pm" : "am"}`];
}
