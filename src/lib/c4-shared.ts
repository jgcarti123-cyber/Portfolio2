import type { Board } from "./connect4";

// Shapes shared by the live-game server routes and the browser.

export const JOIN_WINDOW_MS = 15 * 60 * 1000; // a challenge waits 15 minutes for John

export type GameRow = {
  id: string;
  created_at: string;
  status: "waiting" | "live" | "done" | "expired";
  visitor_name: string;
  visitor_note: string | null;
  board: Board;
  turn: 1 | 2;
  winner: 0 | 1 | 2 | null;
  win_cells: number[] | null;
  last_move: number | null;
  moves: number;
};

export const isExpired = (g: Pick<GameRow, "status" | "created_at">) =>
  g.status === "waiting" &&
  Date.now() - new Date(g.created_at).getTime() > JOIN_WINDOW_MS;

/**
 * Keeps whichever copy of a game is furthest along. The move count only ever goes up, so an older
 * or out-of-order copy is ignored; at the same count a status change (like the game ending) wins.
 */
export function newer(prev: GameRow | null, next: GameRow): GameRow {
  if (!prev || prev.id !== next.id) return next;
  if (next.moves > prev.moves) return next;
  if (next.moves === prev.moves && next.status !== prev.status) return next;
  return prev;
}
