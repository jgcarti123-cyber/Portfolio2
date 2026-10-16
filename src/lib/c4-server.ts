import "server-only";
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { JOIN_WINDOW_MS, type GameRow } from "./c4-shared";
import type { Player } from "./connect4";

export { isExpired, type GameRow } from "./c4-shared";

// Server-only helpers for live Connect 4: database access, signed links and the owner cookie.

export const OWNER_COOKIE = "c4_owner";
const OWNER_COOKIE_DAYS = 60;

/** Environment value with stray spaces and newlines removed (easy to paste in by accident). */
const env = (name: string) => (process.env[name] ?? "").trim();

export function liveGamesConfigured() {
  return Boolean(
    env("NEXT_PUBLIC_SUPABASE_URL") &&
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
    // TEMPORARY diagnostic (remove once live games work in production): error type and message only.
    const debug = `${(e as Error)?.name}: ${String((e as Error)?.message).slice(0, 160)}`;
    return Response.json(
      { error: "Something went wrong on our side, please try again", debug },
      { status: 500 },
    );
  }
}

/** Service-role client: bypasses RLS, so it only ever runs on the server. */
export function db() {
  return createClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
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
 * Tells John a visitor wants to play. Phase 3 sends this to Telegram; until then it is logged,
 * so the Join link can be copied from the server logs (Vercel → Logs, or the dev terminal).
 */
export async function notifyOwner(
  game: Pick<GameRow, "visitor_name" | "visitor_note">,
  link: string,
) {
  console.info(
    `[connect4] ${game.visitor_name} wants to play${game.visitor_note ? ` ("${game.visitor_note}")` : ""}: ${link}`,
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
