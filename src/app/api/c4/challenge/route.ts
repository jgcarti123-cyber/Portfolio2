import { NextResponse, type NextRequest } from "next/server";
import {
  challengeBlocked,
  clientIp,
  db,
  guarded,
  hashIp,
  hashToken,
  joinLink,
  liveGamesConfigured,
  newSeatToken,
  notifyOwner,
  pruneOldGames,
} from "@/lib/c4-server";
import { verifyTurnstile } from "@/lib/turnstile";

/** A visitor challenges John: checks them out, creates a waiting game and pings him on Telegram. */
export async function POST(req: NextRequest) {
  return guarded("challenge", async () => {
    if (!liveGamesConfigured())
      return NextResponse.json(
        { error: "Live games are not set up" },
        { status: 503 },
      );

    const body = (await req.json().catch(() => ({}))) as {
      name?: unknown;
      note?: unknown;
      turnstile?: unknown;
    };
    const name =
      typeof body.name === "string" ? body.name.trim().slice(0, 24) : "";
    const note =
      typeof body.note === "string" ? body.note.trim().slice(0, 140) : "";
    if (!name)
      return NextResponse.json(
        { error: "Please add a nickname" },
        { status: 400 },
      );

    // 1. Human check, then 2. spam limits, both before anything is written or sent.
    const ip = clientIp(req);
    if (!(await verifyTurnstile(body.turnstile, ip)))
      return NextResponse.json(
        {
          error: "Couldn't confirm you're human. Please reload and try again.",
        },
        { status: 403 },
      );

    const ipHash = ip ? hashIp(ip) : null;
    const blocked = await challengeBlocked(ipHash);
    if (blocked) return NextResponse.json({ error: blocked }, { status: 429 });

    const supabase = db();
    const { data: game, error } = await supabase
      .from("c4_games")
      .insert({ visitor_name: name, visitor_note: note || null })
      .select("id, visitor_name, visitor_note")
      .single();
    if (error || !game) {
      console.error("[connect4] insert game failed:", error);
      return NextResponse.json(
        { error: "Could not start a game" },
        { status: 500 },
      );
    }

    const token = newSeatToken();
    const { error: seatError } = await supabase
      .from("c4_seats")
      .insert({
        game_id: game.id,
        visitor_token_hash: hashToken(token),
        ip_hash: ipHash,
      });
    if (seatError) {
      console.error("[connect4] insert seat failed:", seatError);
      await supabase.from("c4_games").delete().eq("id", game.id);
      return NextResponse.json(
        { error: "Could not start a game" },
        { status: 500 },
      );
    }

    // 3. Ping John. If Telegram is set up but fails, don't leave the visitor waiting for nothing.
    const pinged = await notifyOwner(
      game,
      joinLink(req.nextUrl.origin, game.id),
    );
    if (!pinged) {
      await supabase.from("c4_games").delete().eq("id", game.id);
      return NextResponse.json(
        { error: "Couldn't reach John just now. Try again in a minute." },
        { status: 502 },
      );
    }

    void pruneOldGames().catch(() => {});
    return NextResponse.json({ id: game.id, token });
  });
}
