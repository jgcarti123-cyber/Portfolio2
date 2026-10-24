"use client";

import { profile } from "@/data/site";

// J is the site's pixel footballer. Other components tell J what happened through this tiny event bus,
// and every line J says lives here so the voice stays in one place: lowercase, understated, quietly sure of
// itself. Never loud, never more than a sentence or two.

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
  // First visit
  hello: "j. john builds the agents. i handle the ball. we both deliver.",
  dare: "the ball's right there. a single tap is all it takes.",

  // Poking and fouls
  flinch: ["please don't.", "i'll allow it. once."],
  yellow: "a yellow. bold of you.",
  red: "a red. i'll be in the dressing room.",
  back: "back. nothing happened.",
  woken: "awake. i was resting my eyes.",
  night: (time: string) => `it's ${time} in kochi. i was resting.`,

  // The ball
  kicked: "that's my ball. i'll allow it.",
  bulb: "clean finish. the lights agree.",
  newBall: "fresh ball. these things happen.",
  flex: ["allow me.", "watch this.", "one second."],
  flexHit: ["clean.", "and that's why i'm captain.", "on the house."],
  firstBreak: "don't worry. it grows back.",
  userBreak: ["it grows back.", "that's coming out of your wages."],

  // The rest of the site
  dark: ["lights off. the stadium looks better.", "dark mode. an excellent call."],
  light: ["a bit bright. we'll manage.", "floodlights on."],
  cordSpam: ["it's a switch, not a fidget toy.", "decide. i'll wait."],
  email: "copied. go on, say hello.",
  online: "john's online. challenge him at connect 4. he plays to win.",
  c4Lose: ["a loss. it happens to the best of us.", "the bot sends its regards."],
  c4Draw: "a draw. very diplomatic.",
  c4Win: (level: string) =>
    level === "hard" ? "you beat hard mode. i'd have been faster." : `you beat the ${level} bot. fine work.`,
  project: {
    aiva: "aiva. 25+ engineers rely on it. no big deal.",
    "prim-pets": "200+ vet documents. it knows more about dogs than i do.",
    "swiggy-agent": "fills your cart, never checks out. discipline.",
    "hil-runner": "tests a car from anywhere. the car doesn't mind.",
    "docs-rag": "300 documents read so you don't have to.",
    "yaml-generator": "replaced a vendor tool. quietly.",
  } as Record<string, string>,
  projectOther: "good taste.",

  // Showing people around
  offer: "shall i show you around?",
  offerYes: "Please",
  offerNo: "No thanks",
  tourStart: "right this way.",
  tourSkip: "understood. i'll be around.",
  tourCancel: "understood. self-guided it is.",
  tourEnd: "that's the tour. gratuities are optional.",
  tour: {
    graph: "the graph. thirty days of commits. the green is deliberate.",
    connect4: "connect 4. the bot is decent. john is better.",
    Featured: "featured. start with aiva. everything else is the warm-up.",
    "At Tata Motors": "the day job. connected cars, real hardware, 25+ engineers.",
    Experience: "experience. short list. every line earns its place.",
    Connect: "and this is where you say hello. he replies.",
  } as Record<string, string>,
  peek: {
    graph: "thirty days of commits. the green is deliberate.",
    connect4: "connect 4. beat the bot and i'll notice.",
    Featured: "featured. three projects, one clear favourite.",
    "At Tata Motors": "the day job. 25+ engineers rely on this work.",
    Experience: "short list. every line earns its place.",
    Connect: "he replies. it's a known habit.",
    footer: "that's the page. you've seen the work. now say hello.",
  } as Record<string, string>,
  pages: {
    "/shelf": "the shelf. what's on john's desk. taste is a skill.",
    "/skills": "skills. the ones he actually uses.",
  } as Record<string, string>,

  // Getting people to open a project
  nudge: [
    ["the projects are right there. no pressure.", "the good part of this page is one click away."],
    ["some pressure. open aiva.", "aiva is waiting. it won't complain, but still."],
    ["last call. aiva has a demo video. it's very good.", "final reminder. i'd click it. i'm biased."],
  ] as string[][],
  nudgeScroll: "the projects are a short scroll down. i'll wait.",
};

/** How long a line should stay up: a beat plus reading time. */
export const readTime = (text: string) => Math.min(7000, 1400 + text.length * 45);

/** A random line that isn't the one picked last time from the same list. */
const lastPick = new Map<readonly string[], string>();
export function pick(list: readonly string[]) {
  const options = list.length > 1 ? list.filter((l) => l !== lastPick.get(list)) : list;
  const line = options[Math.floor(Math.random() * options.length)];
  lastPick.set(list, line);
  return line;
}

/** Has J already said this during this visit? */
export function heard(key: string) {
  try {
    return sessionStorage.getItem(`mascot-${key}`) !== null;
  } catch {
    return false;
  }
}

export function markHeard(key: string) {
  try {
    sessionStorage.setItem(`mascot-${key}`, "1");
  } catch {}
}

/** True the first time it's called with a key during a visit. */
export function once(key: string) {
  const seen = heard(key);
  markHeard(key);
  return !seen;
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
