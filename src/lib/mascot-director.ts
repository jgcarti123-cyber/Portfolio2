// The part of J that shows people around: it offers a tour, comments on each section the first time it comes
// into view, and, if nobody has opened a project after a while, nudges them towards one. Everything J can
// physically do (hop onto something, tap the ball, speak) comes in through `Deps`, so this file only decides
// what to do and when.

import { heard, lines, markHeard, once, pick } from "./mascot";

export type Deps = {
  say: (text: string, ms?: number) => void;
  /** Nothing is being said, and nothing was said a moment ago. */
  quiet: () => boolean;
  /** J is standing about with the ball and isn't busy with anything. */
  free: () => boolean;
  /** Hop onto an element (`at` is how far along it, 0 to 1) and call back on landing. False if J can't. */
  hop: (el: Element, at: number, then?: () => void) => boolean;
  /** A quick kick toward whatever J is facing. */
  tap: () => void;
  /** Hop to somewhere ordinary, off whatever J is standing on. */
  away: () => void;
  /** While held, J stays put instead of wandering off. */
  hold: (on: boolean) => void;
  /** Show or hide the "shall i show you around?" bubble. */
  offer: (on: boolean) => void;
  later: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  reduce: boolean;
};

type Spot = { key: string; sel: string; at: number; pulse?: string };

/** In page order, which is also tour order. `key` is the section's label, or a name for the rest. */
const SPOTS: Spot[] = [
  { key: "graph", sel: '[data-ground="graph"]', at: 0.5 },
  { key: "connect4", sel: '[data-ground="connect4"]', at: 0.5 },
  { key: "Featured", sel: '[data-ground="Featured"]', at: 0.2, pulse: "aiva" },
  { key: "At Tata Motors", sel: '[data-ground="At Tata Motors"]', at: 0.2 },
  { key: "Experience", sel: '[data-ground="Experience"]', at: 0.2 },
  { key: "Connect", sel: '[data-ground="Connect"]', at: 0.2 },
  { key: "footer", sel: '[data-ground="footer"]', at: 0.5 },
];
const TOUR = SPOTS.filter((s) => s.key !== "footer");

const OFFER_KEY = "mascot-tour-offered";
const INTRO_MS = 9000; // let the hello finish before anything else
const TALK_GAP = 8000; // between lines J starts on its own
const OFFER_AT = 12000;
const FIRST_NUDGE = 24000;
const NEXT_NUDGE = 28000;

const PRIORITY = ["aiva", "prim-pets", "swiggy-agent"];

const findVisible = (sel: string) =>
  [...document.querySelectorAll(sel)].find((el) => el.getBoundingClientRect().width > 0) ?? null;

/** Is the element in the middle band of the screen, where J can stand on it and be seen? */
const inBand = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.top > 120 && r.top < window.innerHeight * 0.64;
};

export function createDirector(d: Deps) {
  const started = performance.now();
  let lastTalk = 0;
  let lastNudge = started;
  let nudges = 0;
  let told = false; // said the projects are further down
  let opened = false;
  let offer: "idle" | "shown" | "done" = "idle";
  try {
    if (sessionStorage.getItem(OFFER_KEY)) offer = "done";
  } catch {}
  let touring = false;
  let token = 0;
  let path = location.pathname;
  let pagePending = true;
  const inView = new Map<string, number>();

  const talk = (text: string, ms?: number) => {
    lastTalk = performance.now();
    d.say(text, ms);
  };

  const pulse = (row: Element) => {
    row.classList.remove("mascot-nudge");
    void (row as HTMLElement).offsetWidth; // restart the animation if it's already running
    row.classList.add("mascot-nudge");
    d.later(() => row.classList.remove("mascot-nudge"), 1000);
  };

  const rows = () =>
    [...document.querySelectorAll<HTMLElement>("[data-nudge]")].filter((r) => {
      const b = r.getBoundingClientRect();
      return b.width > 0 && b.top > 110 && b.bottom < window.innerHeight - 80;
    });
  const rank = (r: HTMLElement) => {
    const i = PRIORITY.indexOf(r.dataset.project ?? "");
    return i < 0 ? PRIORITY.length : i;
  };
  const row = (slug: string) => rows().find((r) => r.dataset.project === slug) ?? null;

  // ---- The offer and the tour ----------------------------------------------------------------------

  function showOffer() {
    offer = "shown";
    try {
      sessionStorage.setItem(OFFER_KEY, "1");
    } catch {}
    d.offer(true);
    d.later(() => {
      if (offer !== "shown") return;
      offer = "done";
      d.offer(false);
    }, 16000);
  }

  function skip() {
    if (offer !== "shown") return;
    offer = "done";
    d.offer(false);
    talk(lines.tourSkip, 2400);
  }

  const wait = (ms: number) => new Promise<void>((res) => d.later(res, ms));

  /** Scrolls so the element sits comfortably in view, and resolves once the page has stopped moving. */
  async function bring(el: Element) {
    const r = el.getBoundingClientRect();
    if (r.top > 130 && r.top < window.innerHeight * 0.62) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const to = Math.min(max, Math.max(0, window.scrollY + r.top - window.innerHeight * 0.36));
    if (Math.abs(to - window.scrollY) < 8) return;
    window.scrollTo({ top: to, behavior: d.reduce ? "auto" : "smooth" });
    let last = -1;
    let still = 0;
    for (let waited = 0; waited < 1800 && still < 4; waited += 60) {
      await wait(60);
      still = Math.abs(window.scrollY - last) < 1 ? still + 1 : 0;
      last = window.scrollY;
    }
  }

  async function tour() {
    if (touring) return;
    offer = "done";
    d.offer(false);
    touring = true;
    const me = ++token;
    const alive = () => token === me;
    d.hold(true);
    talk(lines.tourStart, 1800);
    await wait(1800);
    for (const stop of TOUR) {
      if (!alive()) return;
      const el = findVisible(stop.sel);
      if (!el) continue;
      markHeard(`c:${stop.key}`);
      await bring(el);
      if (!alive()) return;
      await Promise.race([new Promise<void>((res) => (d.hop(el, stop.at, res) ? undefined : res())), wait(2600)]);
      if (!alive()) return;
      talk(lines.tour[stop.key]);
      if (stop.pulse) {
        await wait(1500);
        if (!alive()) return;
        const target = row(stop.pulse);
        if (target) {
          d.tap();
          pulse(target);
        }
        await wait(2600);
      } else {
        await wait(Math.max(3200, lines.tour[stop.key].length * 55));
      }
    }
    if (!alive()) return;
    touring = false;
    lastNudge = performance.now(); // the tour already pointed at aiva, so don't nag straight after it
    d.hold(false);
    talk(lines.tourEnd, 3400);
  }

  /** The visitor scrolled, tapped or pressed a key: the tour ends, politely. */
  function interrupt() {
    if (!touring) return;
    token++;
    touring = false;
    d.hold(false);
    talk(lines.tourCancel, 2600);
  }

  function projectOpened() {
    opened = true;
    if (touring) {
      token++;
      touring = false;
      d.hold(false);
    }
    if (offer === "shown") {
      offer = "done";
      d.offer(false);
    }
  }

  // ---- Ambient: page lines, nudges and commentary --------------------------------------------------

  function nudge() {
    lastNudge = performance.now();
    const visible = rows().sort((a, b) => rank(a) - rank(b));
    if (!visible.length) {
      if (!told) {
        told = true;
        talk(lines.nudgeScroll);
      }
      return;
    }
    const target = visible[0];
    const line = pick(lines.nudge[Math.min(nudges, lines.nudge.length - 1)]);
    nudges++;
    d.hold(true);
    const go = () => {
      d.tap();
      pulse(target);
      talk(line);
      d.later(() => {
        d.hold(false);
        d.away();
      }, 4800);
    };
    if (!d.hop(target, 0.88, go)) {
      d.hold(false);
      pulse(target);
      talk(line);
    }
  }

  /** Called every second or so. Starts at most one thing, and only when J has nothing else going on. */
  function ambient() {
    if (touring || document.visibilityState !== "visible") return;
    const now = performance.now();
    if (now - started < INTRO_MS || now - lastTalk < TALK_GAP) return;
    if (!d.quiet() || !d.free()) return;
    const home = location.pathname === "/";

    if (home && offer === "idle" && now - started > OFFER_AT) return showOffer();
    if (offer === "shown") return;

    if (location.pathname !== path) {
      path = location.pathname;
      pagePending = true;
    }
    if (pagePending) {
      pagePending = false;
      const line = lines.pages[path];
      if (line && once(`page:${path}`)) return talk(line);
    }
    if (!home) return;

    if (!opened && nudges < 3 && now - lastNudge > (nudges === 0 ? FIRST_NUDGE : NEXT_NUDGE)) return nudge();

    for (const spot of SPOTS) {
      if (heard(`c:${spot.key}`)) continue;
      const el = findVisible(spot.sel);
      if (!el || !inBand(el)) {
        inView.delete(spot.key);
        continue;
      }
      const since = inView.get(spot.key) ?? now;
      inView.set(spot.key, since);
      if (now - since < 900) continue; // it has to stay in view a moment, so scrolling past doesn't count
      markHeard(`c:${spot.key}`);
      const say = () => talk(lines.peek[spot.key]);
      if (!d.hop(el, spot.at, say)) say();
      return;
    }
  }

  return { ambient, tour, skip, interrupt, projectOpened };
}
