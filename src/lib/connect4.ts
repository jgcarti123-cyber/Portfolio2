// Connect 4 rules and a bot. Pure functions, no React, so they can be tested and reused server-side
// (phase 2 validates live moves with the same code).

export const ROWS = 6;
export const COLS = 7;

/** 0 = empty, 1 = player one, 2 = player two. Index = row * COLS + col, row 0 is the top. */
export type Cell = 0 | 1 | 2;
export type Board = Cell[];
export type Player = 1 | 2;
export type Difficulty = "easy" | "medium" | "hard";

export const emptyBoard = (): Board => Array(ROWS * COLS).fill(0);

export const other = (p: Player): Player => (p === 1 ? 2 : 1);

/** Row the disc would land in, or -1 when the column is full. */
export function landingRow(board: Board, col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) if (board[r * COLS + col] === 0) return r;
  return -1;
}

export function validMoves(board: Board): number[] {
  const moves: number[] = [];
  for (let c = 0; c < COLS; c++) if (board[c] === 0) moves.push(c);
  return moves;
}

/** Returns a new board with the disc dropped, plus the row it landed in. */
export function drop(board: Board, col: number, player: Player): { board: Board; row: number } | null {
  const row = landingRow(board, col);
  if (row < 0) return null;
  const next = board.slice();
  next[row * COLS + col] = player;
  return { board: next, row };
}

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

/** The winner and the four (or more) winning cells, or null. */
export function findWin(board: Board): { player: Player; cells: number[] } | null {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r * COLS + c];
      if (!p) continue;
      for (const [dr, dc] of DIRECTIONS) {
        const cells = [r * COLS + c];
        let rr = r + dr;
        let cc = c + dc;
        while (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && board[rr * COLS + cc] === p) {
          cells.push(rr * COLS + cc);
          rr += dr;
          cc += dc;
        }
        if (cells.length >= 4) return { player: p, cells };
      }
    }
  }
  return null;
}

export const isFull = (board: Board) => board.every((c, i) => i >= COLS || c !== 0);

// ---------------------------------------------------------------------------------------------
// Bot: negamax with alpha-beta pruning, centre-first move ordering and a window-count heuristic.

const ORDER = [3, 2, 4, 1, 5, 0, 6];
const WIN = 1_000_000;

/** Every line of four cells on the board, precomputed once. */
const WINDOWS: number[][] = (() => {
  const out: number[][] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      for (const [dr, dc] of DIRECTIONS) {
        const end = [r + 3 * dr, c + 3 * dc];
        if (end[0] < 0 || end[0] >= ROWS || end[1] < 0 || end[1] >= COLS) continue;
        out.push([0, 1, 2, 3].map((k) => (r + k * dr) * COLS + (c + k * dc)));
      }
  return out;
})();

function score(board: Board, me: Player): number {
  const them = other(me);
  let s = 0;
  for (let r = 0; r < ROWS; r++) {
    const centre = board[r * COLS + 3];
    if (centre === me) s += 3;
    else if (centre === them) s -= 3;
  }
  for (const w of WINDOWS) {
    let mine = 0;
    let theirs = 0;
    for (const i of w) {
      if (board[i] === me) mine++;
      else if (board[i] === them) theirs++;
    }
    if (mine && theirs) continue;
    if (mine === 3) s += 5;
    else if (mine === 2) s += 2;
    else if (theirs === 3) s -= 4;
    else if (theirs === 2) s -= 1;
  }
  return s;
}

/** Did the disc just placed at (row, col) complete a line? Cheaper than findWin inside the search. */
function wins(board: Board, row: number, col: number): boolean {
  const p = board[row * COLS + col];
  for (const [dr, dc] of DIRECTIONS) {
    let n = 1;
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r * COLS + c] === p) {
        n++;
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (n >= 4) return true;
  }
  return false;
}

function negamax(board: Board, depth: number, alpha: number, beta: number, me: Player): number {
  const moves = ORDER.filter((c) => board[c] === 0);
  if (!moves.length) return 0;
  if (depth === 0) return score(board, me);

  let best = -Infinity;
  for (const col of moves) {
    const row = landingRow(board, col);
    board[row * COLS + col] = me;
    const value = wins(board, row, col) ? WIN + depth : -negamax(board, depth - 1, -beta, -alpha, other(me));
    board[row * COLS + col] = 0;
    if (value > best) best = value;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

const DEPTH: Record<Difficulty, number> = { easy: 2, medium: 4, hard: 7 };

/** The bot's column. `random` is injectable so tests are deterministic. */
export function botMove(board: Board, me: Player, difficulty: Difficulty, random = Math.random): number {
  const moves = ORDER.filter((c) => board[c] === 0);
  if (!moves.length) return -1;

  // Easy plays loosely: often a random column, but it still takes a win in one.
  if (difficulty === "easy" && random() < 0.5) {
    for (const col of moves) {
      const d = drop(board, col, me)!;
      if (wins(d.board, d.row, col)) return col;
    }
    return moves[Math.floor(random() * moves.length)];
  }

  // A win in one is always played; no need to search further.
  for (const col of moves) {
    const d = drop(board, col, me)!;
    if (wins(d.board, d.row, col)) return col;
  }

  const work = board.slice();
  let bestCol = moves[0];
  let best = -Infinity;
  for (const col of moves) {
    const row = landingRow(work, col);
    work[row * COLS + col] = me;
    const value = wins(work, row, col)
      ? WIN + DEPTH[difficulty]
      : -negamax(work, DEPTH[difficulty] - 1, -Infinity, Infinity, other(me));
    work[row * COLS + col] = 0;
    if (value > best) {
      best = value;
      bestCol = col;
    }
  }
  return bestCol;
}
