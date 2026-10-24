// The part of J that shows people around. It offers a tour of the home page, which ends by pointing at the
// toolbar (J never opens a page for anyone); offers to walk people round the Shelf and Skills when they open
// them; comments on each section the first time it comes into view; and, if nobody has opened a project after a
// while, nudges them towards one. A tour that gets interrupted (a click, a scroll, a key) pauses instead of
// ending, and J asks whether to carry on from wherever the visitor has got to. Everything J can physically do
// (hop onto something, tap the ball, speak) comes in through `Deps`, so this file only decides what and when.

import { heard, lines, markHeard, once, pick, type Ask, type Tone } from "./mascot";

export type Deps = {
  say: (text: string, ms?: number, tone?: Tone) => void;
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
  /** Show a question with two buttons, or take it down (null). */
  offer: (ask: Ask | null) => void;
  later: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  reduce: boolean;
};

type Page = "home" | "shelf" | "skills";
type Spot = { key: string; sel: string; at: number; pulse?: string };

const PATHS: Record<Page, string> = { home: "/", shelf: "/shelf", skills: "/skills" };

/** The home page, in page order, which is also tour order. `key` is the section's label or a name for the rest. */
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
/** On wide screens these sit in a column that stays put while the page scrolls, so they say nothing about position. */
const ASIDE = new Set(["graph", "connect4"]);
/** The lists J opens on the Shelf, and the skills groups it stops at (the highlights, not everything). */
const SHELF_STOPS = ["ai-tools", "agents", "read", "music"];
const SKILLS_STOPS = ["AI Engineering", "Full-Stack", "Engineering Habits"];
/** How many stops each page's tour has. Home has one more than its sections: pointing at the toolbar. */
const TOTAL: Record<Page, number> = { home: TOUR.length + 1, shelf: SHELF_STOPS.length, skills: SKILLS_STOPS.length };

const OFFER_KEY = "mascot-tour-offered";
const INTRO_MS = 9000; // let the hello finish before anything else
const TALK_GAP = 8000; // between lines J starts on its own
const OFFER_AT = 12000;
const PAGE_OFFER_AT = 6000; // after a visitor opens the Shelf or Skills
const FIRST_NUDGE = 24000;
const NEXT_NUDGE = 28000;
const STILL_MS = 2000; // how long a visitor must be still before J asks whether to carry on
const AFTER_SHEET_MS = 600; // ...or, if the last thing they did was close a project, how long after that
const WATCH_MS = 300; // how often J checks, while a tour is paused
const ASK_MS = 18000;

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
  let pageSince = started;
  let lastTalk = 0;
  let lastNudge = started;
  let nudges = 0;
  let told = false; // said the projects are further down
  let opened = false;
  let offered = false; // the home tour has been offered during this visit
  try {
    offered = sessionStorage.getItem(OFFER_KEY) !== null;
  } catch {}
  let path = location.pathname;
  let answer: ((yes: boolean | null) => void) | null = null;
  let askId = 0;
  const inView = new Map<string, number>();

  // The tour that's running, how far it has got, and, if the visitor interrupted it, where it stopped.
  let touring = false;
  let token = 0;
  let tourPage: Page = "home";
  let cursor: { i: number; spoken: boolean } | null = null;
  let paused: { page: Page; next: number; scrollY: number } | null = null;
  let lastInput = 0; // the visitor's last click, scroll or key
  let lastY = 0;
  let movedAt = 0; // the last time the page was seen moving while paused
  let pausedAt = 0;
  let sheetClosedAt = 0; // when a project sheet last closed
  let watching = false;

  // Closing a project is the moment to ask, so listen for it rather than wait for the next check.
  const onSheetClosed = (e: Event) => {
    if (e.target instanceof HTMLDialogElement) sheetClosedAt = performance.now();
  };
  document.addEventListener("close", onSheetClosed, true); // dialog close events don't bubble

  const talk = (text: string, ms?: number, tone?: Tone) => {
    lastTalk = performance.now();
    d.say(text, ms, tone);
  };
  const wait = (ms: number) => new Promise<void>((res) => d.later(res, ms));

  /** Restarts the little shove-and-ring on an element (or on the part of it marked data-pulse). */
  const pulse = (el: Element) => {
    const target = el.querySelector("[data-pulse]") ?? el;
    target.classList.remove("mascot-nudge");
    void (target as HTMLElement).offsetWidth; // restart the animation if it's already running
    target.classList.add("mascot-nudge");
    d.later(() => target.classList.remove("mascot-nudge"), 1000);
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

  // ---- Questions -----------------------------------------------------------------------------------

  /** Asks with two buttons. Resolves true or false for a button, or null when nobody answered in time. */
  function ask(spec: Ask) {
    return new Promise<boolean | null>((resolve) => {
      const id = ++askId;
      const settle = (yes: boolean | null) => {
        if (askId !== id || !answer) return;
        answer = null;
        d.offer(null);
        resolve(yes);
      };
      answer = settle;
      d.offer(spec);
      d.later(() => settle(null), ASK_MS);
    });
  }

  const reply = (yes: boolean) => answer?.(yes);

  // ---- Getting around ------------------------------------------------------------------------------

  /** Scrolls the page to `top` (unless it's already about there) and resolves once it has stopped moving. */
  async function scrollTo(top: number) {
    if (Math.abs(top - window.scrollY) < 8) return;
    window.scrollTo({ top, behavior: d.reduce ? "auto" : "smooth" });
    let last = -1;
    let still = 0;
    for (let waited = 0; waited < 1800 && still < 4; waited += 60) {
      await wait(60);
      still = Math.abs(window.scrollY - last) < 1 ? still + 1 : 0;
      last = window.scrollY;
    }
  }

  /** Scrolls so the element sits comfortably in view, and resolves once the page has stopped moving. */
  async function bring(el: Element) {
    const r = el.getBoundingClientRect();
    if (r.top > 130 && r.top < window.innerHeight * 0.62) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    await scrollTo(Math.min(max, Math.max(0, window.scrollY + r.top - window.innerHeight * 0.36)));
  }

  /** Hops onto the element and resolves on landing (or after a moment if J can't get there). */
  const hopTo = (el: Element, at: number) =>
    Promise.race([new Promise<void>((res) => (d.hop(el, at, res) ? undefined : res())), wait(2600)]);

  /** One stop: scroll to it, hop onto it, say the line, and stay a while. False if the tour ended. */
  async function atStop(alive: () => boolean, el: Element, at: number, line: string, extra?: () => Promise<void>) {
    await bring(el);
    if (!alive()) return false;
    await hopTo(el, at);
    if (!alive()) return false;
    talk(line);
    if (cursor) cursor.spoken = true;
    if (extra) await extra();
    else await wait(Math.max(3200, line.length * 55));
    return alive();
  }

  // ---- The tours -----------------------------------------------------------------------------------

  async function homeStops(alive: () => boolean, from: number) {
    for (let i = from; i < TOUR.length; i++) {
      if (!alive()) return false;
      const stop = TOUR[i];
      cursor = { i, spoken: false };
      const el = findVisible(stop.sel);
      if (!el) continue;
      markHeard(`c:${stop.key}`);
      const point = stop.pulse
        ? async () => {
            await wait(1500);
            if (!alive()) return;
            const target = row(stop.pulse!);
            if (target) {
              d.tap();
              pulse(target);
            }
            await wait(2600);
          }
        : undefined;
      if (!(await atStop(alive, el, stop.at, lines.tour[stop.key], point))) return false;
    }
    return alive();
  }

  /**
   * The last stop of the home tour: back to the top, J beside the toolbar, a line about the other pages, and the
   * Shelf and Skills icons pulse in turn. J never opens a page: the visitor does.
   */
  async function doors(alive: () => boolean) {
    const here = { i: TOUR.length, spoken: false };
    cursor = here;
    const nav = findVisible('nav[aria-label="Site"]');
    const shelf = nav?.querySelector('a[href="/shelf"]');
    const skills = nav?.querySelector('a[href="/skills"]');
    const bar = nav?.parentElement as HTMLElement | null | undefined; // on wide screens it fades in on hover only
    const pointing = Boolean(nav && shelf && skills);
    try {
      if (nav && pointing) {
        await scrollTo(0);
        if (!alive()) return false;
        if (bar) bar.style.opacity = "1";
        await hopTo(nav, 0.5);
        if (!alive()) return false;
      }
      talk(lines.otherPages);
      here.spoken = true;
      if (shelf && skills) {
        await wait(1300);
        if (!alive()) return false;
        d.tap();
        pulse(shelf);
        await wait(900);
        if (!alive()) return false;
        pulse(skills);
        await wait(1800);
      } else await wait(3500);
      return alive();
    } finally {
      if (bar) bar.style.opacity = "";
    }
  }

  async function shelfStops(alive: () => boolean, from: number) {
    markHeard("offer:/shelf");
    const heading = findVisible('[data-ground="Lists"]');
    if (heading) {
      await bring(heading);
      if (!alive()) return false;
      await hopTo(heading, 0.3);
      if (!alive()) return false;
    }
    // On a phone the lists open and fold above the cards, which shifts the cards. J stays on the steady "Lists"
    // line there and points at the cards from it. On wider screens nothing shifts, so J can stand on the cards.
    const phone = Boolean(findVisible("[data-picker-bar]"));

    for (let i = from; i < SHELF_STOPS.length; i++) {
      if (!alive()) return false;
      const slug = SHELF_STOPS[i];
      const here = { i, spoken: false };
      cursor = here;
      // On phones the lists fold into a bar after one is picked: open them again, so people see it being chosen.
      const bar = findVisible("[data-picker-bar]");
      if (bar?.getAttribute("aria-expanded") === "false") {
        (bar as HTMLElement).click();
        await wait(400);
        if (!alive()) return false;
      }
      const tab = findVisible(`[data-slug="${slug}"]`);
      if (!tab) continue;
      if (slug === "music") markHeard("roast:music"); // the tour is about to roast it, so don't again afterwards
      await bring(tab);
      if (!alive()) return false;
      pulse(tab);
      await wait(450);
      if (!alive()) return false;
      (tab as HTMLElement).click();
      await wait(800); // the cards fading in
      if (!alive()) return false;

      const card = findVisible('[data-ground="card"]');
      if (card && !phone) {
        await bring(card);
        if (!alive()) return false;
        await hopTo(card, 0.5);
        if (!alive()) return false;
      }
      talk(lines.tourShelf[slug]);
      here.spoken = true;
      if (card) {
        await wait(1300);
        if (!alive()) return false;
        d.tap();
        pulse(card); // "start here"
        await wait(2200);
      } else await wait(3500);
    }
    return alive();
  }

  async function skillsStops(alive: () => boolean, from: number) {
    markHeard("offer:/skills");
    for (let i = from; i < SKILLS_STOPS.length; i++) {
      if (!alive()) return false;
      const key = SKILLS_STOPS[i];
      cursor = { i, spoken: false };
      const el = findVisible(`[data-ground="${key}"]`);
      if (el && !(await atStop(alive, el, 0.2, lines.tourSkills[key]))) return false;
    }
    return alive();
  }

  /** Runs a page's tour from stop `from`. Interrupting it pauses it (see `pause`); finishing it says its last line. */
  async function tour(page: Page, from = 0) {
    if (touring) return;
    touring = true;
    tourPage = page;
    cursor = null;
    paused = null;
    const me = ++token;
    const alive = () => token === me;
    d.hold(true);
    const end = (line?: string) => {
      if (!alive()) return; // the visitor already interrupted it
      touring = false;
      cursor = null;
      lastNudge = performance.now(); // the tour already pointed at aiva, so don't nag straight after it
      d.hold(false);
      if (line) talk(line, 3800);
    };

    if (page === "home") {
      if (from === 0) {
        talk(lines.tourStart, 1800);
        await wait(1800);
      }
      if (!(await homeStops(alive, from))) return end();
      const done = await doors(alive);
      end();
      if (done) d.away(); // off the toolbar, so J isn't left standing over the icons
      return;
    }
    if (page === "shelf") {
      if (!(await shelfStops(alive, from))) return end();
      return end(lines.shelfEnd);
    }
    if (!(await skillsStops(alive, from))) return end();
    end(lines.tourEnd);
  }

  // ---- Interruptions -------------------------------------------------------------------------------

  /** Stops the running tour but remembers where it got to, so J can offer to pick it up again. */
  function pause() {
    const next = cursor ? (cursor.spoken ? cursor.i + 1 : cursor.i) : 0;
    const page = tourPage;
    token++; // whatever the tour was waiting on now finds itself cancelled
    touring = false;
    if (next >= TOTAL[page]) {
      cursor = null;
      d.hold(false); // it had nothing left to show anyway
      return;
    }
    paused = { page, next, scrollY: window.scrollY };
    lastY = window.scrollY;
    movedAt = pausedAt = performance.now();
    if (!watching) {
      watching = true;
      watch();
    }
  }

  /** Checks a few times a second, while a tour is paused, whether it's time to ask. */
  function watch() {
    if (!paused) {
      watching = false;
      return;
    }
    watchPause(performance.now());
    d.later(watch, WATCH_MS);
  }

  /** The visitor clicked, scrolled or pressed a key: a running tour pauses. (Not while a question is up: that click is the answer.) */
  function interrupt() {
    lastInput = performance.now();
    if (touring && !answer) pause();
  }

  function projectOpened() {
    opened = true;
    lastInput = performance.now();
    if (touring) pause();
    else answer?.(null);
  }

  /** Where a paused tour should pick up: the next stop, or, if the visitor has scrolled off, the first one ahead of them. */
  function resumeAt(p: NonNullable<typeof paused>) {
    if (p.page === "shelf" || Math.abs(window.scrollY - p.scrollY) < 200) return p.next;
    const keys = p.page === "home" ? TOUR.map((s) => s.key) : SKILLS_STOPS;
    for (let i = p.next; i < keys.length; i++) {
      if (p.page === "home" && ASIDE.has(keys[i])) continue;
      const el = findVisible(`[data-ground="${keys[i]}"]`);
      if (el && el.getBoundingClientRect().top > -40) return i;
    }
    // Nothing ahead of them: all that's left is the closing stop (home), or nothing.
    return p.page === "home" ? TOUR.length : keys.length;
  }

  async function offerResume() {
    const p = paused;
    if (!p) return;
    const yes = await ask(lines.askResume);
    if (paused !== p) return;
    paused = null;
    if (yes) return void tour(p.page, resumeAt(p));
    d.hold(false);
    if (yes === false) talk(lines.tourDecline, 3000);
  }

  /** While a tour is paused: wait for the visitor to be still (and any project they opened to be closed), then ask. */
  function watchPause(now: number) {
    const p = paused;
    if (!p) return;
    if (location.pathname !== PATHS[p.page]) {
      // They went to another page themselves; that page's own offer takes over.
      paused = null;
      d.hold(false);
      return;
    }
    if (Math.abs(window.scrollY - lastY) > 1) {
      lastY = window.scrollY;
      movedAt = now;
    }
    if (document.querySelector("dialog[open]")) return; // they're looking at a project: wait until it's closed
    // Closing a project is a clear sign they're done with it, so ask straight away; otherwise let things settle.
    const need = sheetClosedAt > pausedAt ? AFTER_SHEET_MS : STILL_MS;
    if (answer || now - Math.max(lastInput, movedAt) < need) return;
    void offerResume();
  }

  // ---- Offers --------------------------------------------------------------------------------------

  async function offerTour() {
    offered = true;
    try {
      sessionStorage.setItem(OFFER_KEY, "1");
    } catch {}
    const yes = await ask(lines.askTour);
    if (yes) void tour("home");
    else if (yes === false) talk(lines.tourSkip, 2400);
  }

  /** Someone opened the Shelf or Skills page: J offers to show them the best of it. */
  async function offerPage(page: "shelf" | "skills") {
    markHeard(`offer:${PATHS[page]}`);
    const yes = await ask(page === "shelf" ? lines.askShelfWalk : lines.askSkillsWalk);
    if (yes) void tour(page);
    else if (yes === false) talk(lines.tourSkip, 2400);
  }

  /** A visitor opened a list on the Shelf. On Repeat gets teased, once per visit (the tour has its own line). */
  function shelfOpened(slug: string) {
    if (touring || answer || slug !== "music") return; // a question on screen would hide it, so wait
    if (!once("roast:music")) return;
    const line = pick(lines.musicRoast);
    d.later(() => {
      if (touring) return;
      const card = findVisible('[data-ground="card"]'); // the cards fade in first
      const jab = () => {
        d.tap();
        if (card) pulse(card);
        talk(line);
      };
      if (card && d.free() && d.hop(card, 0.5, jab)) return;
      talk(line);
    }, 900);
  }

  // ---- Ambient: page offers, nudges and commentary -------------------------------------------------

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
    if (document.visibilityState !== "visible") return;
    const now = performance.now();
    const here = location.pathname;
    if (here !== path) {
      path = here;
      pageSince = now;
    }
    if (paused || touring || answer) return; // (a paused tour is watched by `watch`, several times a second)
    if (now - started < INTRO_MS || now - lastTalk < TALK_GAP) return;
    if (!d.quiet() || !d.free()) return;
    const home = here === "/";

    if (home && !offered && now - started > OFFER_AT) return void offerTour();
    if (now - pageSince > PAGE_OFFER_AT) {
      if (here === PATHS.shelf && !heard("offer:/shelf")) return void offerPage("shelf");
      if (here === PATHS.skills && !heard("offer:/skills")) return void offerPage("skills");
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

  const dispose = () => document.removeEventListener("close", onSheetClosed, true);

  return { ambient, reply, interrupt, projectOpened, shelfOpened, dispose };
}
