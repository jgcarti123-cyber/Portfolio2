// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { newer, type GameRow } from "../src/lib/c4-shared.ts";

const row = (moves: number, status: GameRow["status"] = "live", id = "g1"): GameRow => ({
  id,
  created_at: "2026-10-17T00:00:00Z",
  status,
  visitor_name: "Test",
  visitor_note: null,
  board: Array(42).fill(0),
  turn: moves % 2 === 0 ? 1 : 2,
  winner: null,
  win_cells: null,
  last_move: null,
  moves,
});

test("a later move replaces the board", () => {
  const next = row(4);
  assert.equal(newer(row(3), next), next);
});

test("an older or repeated copy never rolls the board back", () => {
  const prev = row(4);
  assert.equal(newer(prev, row(3)), prev);
  assert.equal(newer(prev, row(4)), prev);
});

test("the game ending wins at the same move count", () => {
  const done = row(7, "done");
  assert.equal(newer(row(7), done), done);
});

test("a different game always replaces the old one", () => {
  const other = row(0, "waiting", "g2");
  assert.equal(newer(row(9), other), other);
});
