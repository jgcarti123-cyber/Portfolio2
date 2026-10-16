import "server-only";
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { JOIN_WINDOW_MS, type GameRow } from "./c4-shared";
import { cleanSupabaseUrl } from "./supabase-url";
import { challengeMessage, sendTelegram, telegramConfigured } from "./telegram";
import type { Player } from "./connect4";

export { isExpired, type GameRow } from "./c4-shared";

// Server-only helpers for live Connect 4: database access, signed links and the owner cookie.

export const OWNER_COOKIE = "c4_owner";
const OWNER_COOKIE_DAYS = 60;

/** Environment value with stray spaces and newlines removed (easy to paste in by accident). */
const env = (name: string) =>
  (process.env[name] ?? "").trim().replace(/^["']|["']$/g, "");

export function liveGamesConfigured() {
  return Boolean(
    cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    env("SUPABASE_SECRET_KEY") &&
    env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") &&
    env("C4_OWNER_SECRET"),
  );
}

/** Runs a route handler; any failure is logged and returned as JSON instead of a blank 500. */
export async function guarded(
  name: string,
  run: () => Promise<Response>,
): Promise<Response> {
  try {
    return await run();
  } catch (e) {
    console.error(`[connect4] ${name} failed:`, e);
    return Response.json(
      { error: "Something went wrong on our side, please try again" },
      { status: 500 },
    );
  }
}

/** Service-role client: bypasses RLS, so it only ever runs on the server. */
export function db() {
  return createClient(
    cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    env("SUPABASE_SECRET_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

const secret = () => env("C4_OWNER_SECRET");
const sign = (payload: string) =>
  createHmac("sha256", secret()).update(payload).digest("base64url");

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export const newSeatToken = () => randomBytes(24).toString("base64url");
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

/** A one-time-looking Join link, valid for the challenge window. Only ever sent to John. */
export function joinLink(origin: string, gameId: string) {
  const exp = Date.now() + JOIN_WINDOW_MS;
  const sig = sign(`join:${gameId}:${exp}`);
  return `${origin}/api/c4/join?g=${gameId}&e=${exp}&s=${sig}`;
}

export function verifyJoin(gameId: string, exp: string, sig: string) {
  return (
    Number(exp) > Date.now() && safeEqual(sign(`join:${gameId}:${exp}`), sig)
  );
}

/** A link that marks a browser as John's without starting a game, for keeping the site open as "online". */
export function ownerLink(origin: string, minutes = 15) {
  const exp = Date.now() + minutes * 60 * 1000;
  return `${origin}/api/c4/owner?e=${exp}&s=${sign(`owner-link:${exp}`)}`;
}

export function verifyOwnerLink(exp: string, sig: string) {
  return Number(exp) > Date.now() && safeEqual(sign(`owner-link:${exp}`), sig);
}

/** Cookie value that marks this browser as John's: an expiry plus its signature. */
export function ownerCookieValue() {
  const exp = Date.now() + OWNER_COOKIE_DAYS * 24 * 60 * 60 * 1000;
  return {
    value: `${exp}.${sign(`owner:${exp}`)}`,
    maxAge: OWNER_COOKIE_DAYS * 24 * 60 * 60,
  };
}

export function isOwner(cookie: string | undefined) {
  if (!cookie) return false;
  const [exp, sig] = cookie.split(".");
  return (
    Boolean(exp && sig) &&
    Number(exp) > Date.now() &&
    safeEqual(sign(`owner:${exp}`), sig)
  );
}

/**
 * Tells John a visitor wants to play, on Telegram with a Join button. Returns false only when
 * Telegram is set up but refused the message; without Telegram (local dev) the link is logged.
 */
export async function notifyOwner(
  game: Pick<GameRow, "visitor_name" | "visitor_note">,
  link: string,
): Promise<boolean> {
  if (!telegramConfigured()) {
    console.info(
      `[connect4] ${game.visitor_name} wants to play${game.visitor_note ? ` ("${game.visitor_note}")` : ""}: ${link}`,
    );
    return true;
  }
  return sendTelegram(challengeMessage(game.visitor_name, game.visitor_note), {
    label: "Join game",
    url: link,
  });
}

// ------------------------------------------------------------------ spam limits
const IP_WINDOW_MS = 10 * 60 * 1000; // one challenge per visitor every 10 minutes
const DAILY_CAP = 40; // and never more than this many pings a day

/** The visitor's address as Vercel reports it. */
export function clientIp(req: { headers: Headers }): string | null {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip") || null;
}

/** One-way hash of an address, salted with the site secret, so the raw address is never stored. */
export const hashIp = (ip: string) =>
  createHmac("sha256", secret()).update(`ip:${ip}`).digest("hex");

/** Returns a message when this visitor should be turned away, or null when they may challenge. */
export async function challengeBlocked(
  ipHash: string | null,
): Promise<string | null> {
  const supabase = db();
  if (ipHash) {
    const { count } = await supabase
      .from("c4_seats")
      .select("game_id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gt("created_at", new Date(Date.now() - IP_WINDOW_MS).toISOString());
    if (count)
      return "You've already pinged John a moment ago. Give it a few minutes, then try again.";
  }
  const { count: today } = await supabase
    .from("c4_games")
    .select("id", { count: "exact", head: true })
    .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  if ((today ?? 0) >= DAILY_CAP)
    return "John's inbox is full for today. Try again tomorrow, or play the bot.";
  return null;
}

/** Tidies up: forgets finished or expired games after a month. */
export async function pruneOldGames() {
  await db()
    .from("c4_games")
    .delete()
    .lt(
      "created_at",
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    );
}

// ------------------------------------------------------------------ online status
const ONLINE_FOR_MS = 90 * 1000; // John counts as online for 90 seconds after his last check-in

/** John's browser checks in while his tab is open and visible (online) or hands in its notice (offline). */
export async function setOwnerOnline(online: boolean) {
  const { error } = await db()
    .from("c4_status")
    .upsert({
      id: 1,
      last_seen: online ? new Date().toISOString() : new Date(0).toISOString(),
    });
  if (error) throw new Error(`could not save status: ${error.message}`);
}

export async function ownerOnline(): Promise<boolean> {
  const { data } = await db()
    .from("c4_status")
    .select("last_seen")
    .eq("id", 1)
    .single();
  return Boolean(
    data && Date.now() - new Date(data.last_seen).getTime() < ONLINE_FOR_MS,
  );
}

/** Which seat a request holds: 1 = the visitor (by seat token), 2 = John (by owner cookie). */
export async function seatFor(
  ownerCookie: string | undefined,
  gameId: string,
  token: unknown,
): Promise<Player | null> {
  if (typeof token === "string" && token) {
    const { data } = await db()
      .from("c4_seats")
      .select("visitor_token_hash")
      .eq("game_id", gameId)
      .single();
    if (
      data?.visitor_token_hash &&
      safeEqual(data.visitor_token_hash, hashToken(token))
    )
      return 1;
  }
  return isOwner(ownerCookie) ? 2 : null;
}
