import { NextResponse, type NextRequest } from "next/server";
import { drop, findWin, isFull, type Board } from "@/lib/connect4";
import {
  guarded,
  db,
  liveGamesConfigured,
  OWNER_COOKIE,
  seatFor,
  type GameRow,
} from "@/lib/c4-server";

/** Plays one move. The server is the referee: it checks the seat, the turn and the column. */
export async function POST(req: NextRequest) {
  return guarded("move", async () => {
    if (!liveGamesConfigured())
      return NextResponse.json(
        { error: "Live games are not set up" },
        { status: 503 },
      );
    const body = (await req.json().catch(() => ({}))) as {
      id?: unknown;
      col?: unknown;
      token?: unknown;
    };
    const id = typeof body.id === "string" ? body.id : "";
    const col = typeof body.col === "number" ? body.col : -1;
    if (!id || !Number.isInteger(col) || col < 0 || col > 6)
      return NextResponse.json({ error: "Bad move" }, { status: 400 });

    // The game and the seat check don't depend on each other, so fetch them together.
    const supabase = db();
    const [{ data: game }, seat] = await Promise.all([
      supabase.from("c4_games").select("*").eq("id", id).single<GameRow>(),
      seatFor(req.cookies.get(OWNER_COOKIE)?.value, id, body.token),
    ]);
    if (!game)
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    if (!seat)
      return NextResponse.json(
        { error: "You're not playing in this game" },
        { status: 403 },
      );
    // Out-of-turn and finished-game moves come from a board that's behind: send the real one back
    // so the browser can catch up quietly instead of showing an error.
    if (game.status !== "live")
      return NextResponse.json(
        { error: "This game isn't live", row: game },
        { status: 409 },
      );
    if (seat !== game.turn)
      return NextResponse.json(
        { error: "It's not your turn", row: game },
        { status: 409 },
      );

    const result = drop(game.board as Board, col, seat);
    if (!result)
      return NextResponse.json(
        { error: "That column is full" },
        { status: 409 },
      );
    const win = findWin(result.board);
    const draw = !win && isFull(result.board);

    // Only applies if nobody else moved in the meantime (moves is the version number).
    const { data: updated, error } = await supabase
      .from("c4_games")
      .update({
        board: result.board,
        turn: seat === 1 ? 2 : 1,
        last_move: result.row * 7 + col,
        moves: game.moves + 1,
        updated_at: new Date().toISOString(),
        ...(win
          ? { status: "done", winner: win.player, win_cells: win.cells }
          : {}),
        ...(draw ? { status: "done", winner: 0 } : {}),
      })
      .eq("id", id)
      .eq("moves", game.moves)
      .select("*")
      .single<GameRow>();
    if (!updated) {
      // Someone else's move landed first (usually a double click). Hand back the board as it is now.
      if (error && error.code !== "PGRST116")
        console.error("[connect4] move update failed:", error);
      const { data: now } = await supabase
        .from("c4_games")
        .select("*")
        .eq("id", id)
        .single<GameRow>();
      return NextResponse.json(
        { error: "The board changed, try again", row: now },
        { status: 409 },
      );
    }
    return NextResponse.json(updated);
  });
}
