"use client";

import { profile } from "@/data/site";

// J is the site's pixel footballer. Other components tell J what happened through this tiny event bus,
// and every line J says lives here so the voice stays in one place: understated, quietly sure of itself,
// set like print (sentence case, curly apostrophes, real dashes). Never loud, never more than a sentence or
// two. **Double asterisks** mark the words that carry weight (the opener and the punchline of a longer line).

/** A question J asks with two buttons: the words and the labels. */
export type Ask = { text: string; yes: string; no: string };

/**
 * How a line arrives. `glide`: unhurried, for scripted lines (the intro, the tour, offers). `snap`: almost
 * instant and quick to leave, for reactions to what the visitor just did. `jolt`: a snap with a small shake,
 * for when J is irritated. `yellow` and `red`: a jolt with a coloured edge, for the cards.
 */
export type Tone = "glide" | "snap" | "jolt" | "yellow" | "red";

export type MascotEvent =
  | { type: "cord"; dark: boolean }
  | { type: "project"; slug: string }
  | { type: "email" }
  | { type: "shelf"; slug: string }
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
  hello: "**J.** John builds the agents. I handle the ball. **We both deliver.**",
  dare: "The ball’s right there. **A single tap is all it takes.**",

  // Poking and fouls
  flinch: ["Please don’t.", "I’ll allow it. Once."],
  yellow: "A yellow. Bold of you.",
  red: "A red. I’ll be in the dressing room.",
  back: "Back. Nothing happened.",
  woken: "Awake. I was resting my eyes.",
  night: (time: string) => `It’s ${time} in Kochi. I was resting.`,

  // The ball
  kicked: "That’s my ball. I’ll allow it.",
  bulb: "Clean finish. The lights agree.",
  newBall: "Fresh ball. These things happen.",
  flex: ["Allow me.", "Watch this.", "One second."],
  flexHit: ["Clean.", "And that’s why I’m captain.", "On the house."],
  firstBreak: "Don’t worry. It grows back.",
  userBreak: ["It grows back.", "That’s coming out of your wages."],

  // The rest of the site
  dark: ["Lights off. The stadium looks better.", "Dark mode. An excellent call."],
  light: ["A bit bright. We’ll manage.", "Floodlights on."],
  cordSpam: ["It’s a switch, not a fidget toy.", "Decide. I’ll wait."],
  email: "Copied. Go on, say hello.",
  online: "John’s online. Challenge him at Connect 4. He plays to win.",
  c4Lose: ["A loss. It happens to the best of us.", "The bot sends its regards."],
  c4Draw: "A draw. Very diplomatic.",
  c4Win: (level: string) =>
    level === "hard" ? "You beat hard mode. I’d have been faster." : `You beat the ${level} bot. Fine work.`,
  project: {
    aiva: "AIVA. 25+ engineers rely on it. No big deal.",
    "prim-pets": "200+ vet documents. It knows more about dogs than I do.",
    "swiggy-agent": "Fills your cart, never checks out. Discipline.",
    "hil-runner": "Tests a car from anywhere. The car doesn’t mind.",
    "docs-rag": "300 documents read so you don’t have to.",
    "yaml-generator": "Replaced a vendor tool. Quietly.",
  } as Record<string, string>,
  projectOther: "Good taste.",

  // Showing people around
  askTour: { text: "Shall I show you around?", yes: "Please", no: "No thanks" } as Ask,
  askSkillsWalk: {
    text: "This is the skills room. Shall I show you which ones he’d bet on?",
    yes: "Show me",
    no: "I’ll pass",
  } as Ask,
  askResume: { text: "Shall we carry on where we left off?", yes: "Carry on", no: "That’s enough" } as Ask,
  askShelfWalk: {
    text: "The shelf is quite well stocked. Shall I show you the best of it?",
    yes: "Please",
    no: "No thanks",
  } as Ask,
  tourStart: "Right this way.",
  otherPages: "There’s more: Shelf and Skills. Up here. You’ll want both.",
  shelfEnd: "Those are the highlights. The rest of the shelf is yours.",
  tourSkip: "Understood. I’ll be around.",
  tourDecline: "Of course. The offer stands.",
  tourCancel: "Understood. Self-guided it is.",
  tourEnd: "That’s the lot. You’ve now seen more than most recruiters do.",
  tour: {
    graph: "The graph. Thirty days of commits. The green is deliberate.",
    connect4: "Connect 4. The bot is decent. John is better.",
    Featured: "Featured. Start with AIVA. Everything else is the warm-up.",
    "At Tata Motors": "The day job. Connected cars, real hardware, 25+ engineers.",
    Experience: "Experience. A short list. Every line earns its place.",
    Connect: "And this is where you say hello. He replies.",
  } as Record<string, string>,
  peek: {
    graph: "Thirty days of commits. The green is deliberate.",
    connect4: "Connect 4. Beat the bot and I’ll notice.",
    Featured: "Featured. Three projects, one clear favourite.",
    "At Tata Motors": "The day job. 25+ engineers rely on this work.",
    Experience: "A short list. Every line earns its place.",
    Connect: "He replies. It’s a known habit.",
    footer: "That’s the page. You’ve seen the work. Now say hello.",
  } as Record<string, string>,
  /** One line per list, in the order J shows them. */
  tourShelf: {
    "ai-tools": "AI tools. Claude and Claude Code are first for a reason.",
    agents: "Agent frameworks. LangGraph, MCP, the Claude Agent SDK. The serious ones.",
    read: "Read. Begin with Building Effective Agents. Required reading.",
    music: "On Repeat. I won’t criticise the selection. But Savage Garden in the starting eleven? Brave.",
  } as Record<string, string>,
  /** What J says (one of these) when a visitor opens On Repeat on their own: the football-manager roast. */
  musicRoast: [
    "I won’t criticise the selection. But the squad has opinions.",
    "A hundred-song squad and no rotation policy. “Mirrors” alone is extra time.",
    "Savage Garden in the starting eleven. Brave. Very brave.",
  ],
  tourSkills: {
    "AI Engineering": "AI engineering. Skills for building skills. A little recursive.",
    "Full-Stack": "Full-stack. The front end has standards. These are them.",
    "Engineering Habits": "Habits. TDD and code review. The boring things that win.",
  } as Record<string, string>,

  // Getting people to open a project
  nudge: [
    ["The projects are right there — no pressure.", "The good part of this page is one click away."],
    ["Some pressure — open AIVA.", "AIVA is waiting. It won’t complain, but still."],
    ["Last call. AIVA has a demo video. It’s very good.", "Final reminder. I’d click it. I’m biased."],
  ] as string[][],
  nudgeScroll: "The projects are a short scroll down. I’ll wait.",
};

/** How long a line should stay up: a beat plus reading time. */
export const readTime = (text: string) => Math.min(7000, 1400 + text.replace(/\*\*/g, "").length * 45);

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
