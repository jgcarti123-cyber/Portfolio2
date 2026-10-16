import { NextResponse, type NextRequest } from "next/server";
import {
  guarded,
  db,
  liveGamesConfigured,
  OWNER_COOKIE,
  seatFor,
} from "@/lib/c4-server";

/** Leaving a waiting game cancels it; leaving a live game hands the win to the other player. */
export async function POST(req: NextRequest) {
  return guarded("leave", async () => {
    if (!liveGamesConfigured())
      return NextResponse.json(
        { error: "Live games are not set up" },
        { status: 503 },
      );
    const body = (await req.json().catch(() => ({}))) as {
      id?: unknown;
      token?: unknown;
    };
    const id = typeof body.id === "string" ? body.id : "";
    const seat = id
      ? await seatFor(req.cookies.get(OWNER_COOKIE)?.value, id, body.token)
      : null;
    if (!seat)
      return NextResponse.json(
        { error: "You're not playing in this game" },
        { status: 403 },
      );

    const supabase = db();
    await supabase
      .from("c4_games")
      .update({ status: "expired" })
      .eq("id", id)
      .eq("status", "waiting");
    await supabase
      .from("c4_games")
      .update({
        status: "done",
        winner: seat === 1 ? 2 : 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "live");
    return NextResponse.json({ ok: true });
  });
}
