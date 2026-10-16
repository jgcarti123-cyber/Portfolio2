import { NextResponse, type NextRequest } from "next/server";
import {
  guarded,
  db,
  hashToken,
  joinLink,
  liveGamesConfigured,
  newSeatToken,
  notifyOwner,
} from "@/lib/c4-server";

/** A visitor challenges John: creates a waiting game and pings him with a Join link. */
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

    const supabase = db();
    const { data: game, error } = await supabase
      .from("c4_games")
      .insert({ visitor_name: name, visitor_note: note || null })
      .select("id, visitor_name, visitor_note")
      .single();
    if (error || !game)
      return NextResponse.json(
        { error: "Could not start a game" },
        { status: 500 },
      );

    const token = newSeatToken();
    const { error: seatError } = await supabase
      .from("c4_seats")
      .insert({ game_id: game.id, visitor_token_hash: hashToken(token) });
    if (seatError)
      return NextResponse.json(
        { error: "Could not start a game" },
        { status: 500 },
      );

    await notifyOwner(game, joinLink(req.nextUrl.origin, game.id));
    return NextResponse.json({ id: game.id, token });
  });
}
