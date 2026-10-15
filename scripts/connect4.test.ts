// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { botMove, COLS, drop, emptyBoard, findWin, isFull, landingRow, validMoves, type Board, type Player } from "../src/lib/connect4.ts";

/** Plays a list of columns, alternating players starting with 1. */
function play(cols: number[]): Board {
  let board = emptyBoard();
  cols.forEach((c, i) => {
    board = drop(board, c, ((i % 2) + 1) as Player)!.board;
  });
  return board;
}

test("discs stack from the bottom", () => {
  const b = play([3, 3]);
  assert.equal(b[5 * COLS + 3], 1);
  assert.equal(b[4 * COLS + 3], 2);
  assert.equal(landingRow(b, 3), 3);
});

test("a full column refuses more discs", () => {
  const b = play([0, 0, 0, 0, 0, 0]);
  assert.equal(drop(b, 0, 1), null);
  assert.deepEqual(validMoves(b), [1, 2, 3, 4, 5, 6]);
});

test("horizontal, vertical and both diagonal wins are found", () => {
  assert.equal(findWin(play([0, 0, 1, 1, 2, 2, 3]))?.player, 1); // horizontal
  assert.equal(findWin(play([0, 1, 0, 1, 0, 1, 0]))?.player, 1); // vertical
  // rising diagonal from bottom-left
  assert.equal(findWin(play([0, 1, 1, 2, 2, 3, 2, 3, 3, 6, 3]))?.player, 1);
  // falling diagonal
  assert.equal(findWin(play([6, 5, 5, 4, 4, 3, 4, 3, 3, 0, 3]))?.player, 1);
});

test("win cells are reported", () => {
  const win = findWin(play([0, 0, 1, 1, 2, 2, 3]));
  assert.deepEqual(win?.cells.sort((a, b) => a - b), [35, 36, 37, 38]);
});

test("no win on an empty or mixed board", () => {
  assert.equal(findWin(emptyBoard()), null);
  assert.equal(findWin(play([0, 1, 2, 3])), null);
});

test("a full board is detected", () => {
  // Fill column by column in a pattern that avoids four in a row.
  const order = [0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 2, 3, 2, 3, 2, 3, 3, 2, 3, 2, 3, 2, 4, 5, 4, 5, 4, 5, 5, 4, 5, 4, 5, 4, 6, 6, 6, 6, 6, 6];
  let board = emptyBoard();
  order.forEach((c, i) => {
    board = drop(board, c, ((i % 2) + 1) as Player)!.board;
  });
  assert.equal(isFull(board), true);
});

for (const level of ["easy", "medium", "hard"] as const) {
  test(`${level} bot takes an immediate win`, () => {
    // Player 2 has three in column 6; it's player 2's move.
    const b = play([0, 6, 1, 6, 0, 6, 1]);
    assert.equal(botMove(b, 2, level, () => 0.99), 6);
  });
}

test("medium and hard bots block an immediate loss", () => {
  // Player 1 threatens 0-1-2 + 3 on the bottom row; bot is player 2.
  const b = play([0, 6, 1, 6, 2]);
  assert.equal(botMove(b, 2, "medium"), 3);
  assert.equal(botMove(b, 2, "hard"), 3);
});

test("hard bot answers quickly from the opening", () => {
  const start = performance.now();
  botMove(emptyBoard(), 2, "hard");
  botMove(play([3]), 2, "hard");
  assert.ok(performance.now() - start < 1500, "hard bot should think for well under a second per move");
});
