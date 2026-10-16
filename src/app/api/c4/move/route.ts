import { NextResponse, type NextRequest } from "next/server";
import { drop, findWin, isFull, type Board } from "@/lib/connect4";
import { db, liveGamesConfigured, OWNER_COOKIE, seatFor, type GameRow } from "@/lib/c4-server";

/** Plays one move. The server is the referee: it checks the seat, the turn and the column. */
export async function POST(req: NextRequest) {
  if (!liveGamesConfigured()) return NextResponse.json({ error: "Live games are not set up" }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as { id?: unknown; col?: unknown; token?: unknown };
  const id = typeof body.id === "string" ? body.id : "";
  const col = typeof body.col === "number" ? body.col : -1;
  if (!id || !Number.isInteger(col) || col < 0 || col > 6) return NextResponse.json({ error: "Bad move" }, { status: 400 });

  const supabase = db();
  const { data: game } = await supabase.from("c4_games").select("*").eq("id", id).single<GameRow>();
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  if (game.status !== "live") return NextResponse.json({ error: "This game isn't live" }, { status: 409 });

  const seat = await seatFor(req.cookies.get(OWNER_COOKIE)?.value, id, body.token);
  if (!seat) return NextResponse.json({ error: "You're not playing in this game" }, { status: 403 });
  if (seat !== game.turn) return NextResponse.json({ error: "It's not your turn" }, { status: 409 });

  const result = drop(game.board as Board, col, seat);
  if (!result) return NextResponse.json({ error: "That column is full" }, { status: 409 });
  const win = findWin(result.board);
  const draw = !win && isFull(result.board);

  // Only applies if nobody else moved in the meantime (moves is the version number).
  const { data: updated } = await supabase
    .from("c4_games")
    .update({
      board: result.board,
      turn: seat === 1 ? 2 : 1,
      last_move: result.row * 7 + col,
      moves: game.moves + 1,
      updated_at: new Date().toISOString(),
      ...(win ? { status: "done", winner: win.player, win_cells: win.cells } : {}),
      ...(draw ? { status: "done", winner: 0 } : {}),
    })
    .eq("id", id)
    .eq("moves", game.moves)
    .select("*")
    .single<GameRow>();
  if (!updated) return NextResponse.json({ error: "The board changed, try again" }, { status: 409 });
  return NextResponse.json(updated);
}
