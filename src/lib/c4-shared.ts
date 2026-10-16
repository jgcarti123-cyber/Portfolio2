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
  g.status === "waiting" && Date.now() - new Date(g.created_at).getTime() > JOIN_WINDOW_MS;
