"use client";

import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { ArrowCounterClockwise, GameController, PaperPlaneTilt, X } from "@phosphor-icons/react/dist/ssr";
import { isExpired, type GameRow } from "@/lib/c4-shared";
import {
  botMove,
  COLS,
  drop,
  emptyBoard,
  findWin,
  isFull,
  landingRow,
  ROWS,
  type Board,
  type Difficulty,
  type Player,
} from "@/lib/connect4";
import { useHydrated } from "@/lib/hooks";
import { playTick } from "@/lib/sound";
import { useLiveGame } from "@/lib/use-live-game";

const YOU: Player = 1;
const BOT: Player = 2;
const LEVELS: Difficulty[] = ["easy", "medium", "hard"];
const LEVEL_KEY = "c4-level";
const SEAT_KEY = "c4-seat";

type Game = {
  board: Board;
  turn: Player;
  starter: Player;
  last: { index: number; rows: number } | null;
  win: { player: Player; cells: number[] } | null;
  draw: boolean;
};

/** This browser's place in a live game: the visitor (seat 1, with a secret token) or John (seat 2). */
type Seat = { id: string; seat: Player; token?: string };

const newGame = (starter: Player): Game => ({
  board: emptyBoard(),
  turn: starter,
  starter,
  last: null,
  win: null,
  draw: false,
});

function storedLevel(): Difficulty {
  try {
    const v = localStorage.getItem(LEVEL_KEY);
    return LEVELS.includes(v as Difficulty) ? (v as Difficulty) : "medium";
  } catch {
    return "medium";
  }
}

function storedSeat(): Seat | null {
  try {
    const s = JSON.parse(localStorage.getItem(SEAT_KEY) ?? "null");
    return s && typeof s.id === "string" && typeof s.token === "string" ? { id: s.id, seat: 1, token: s.token } : null;
  } catch {
    return null;
  }
}

function saveSeat(seat: Seat | null) {
  try {
    if (seat) localStorage.setItem(SEAT_KEY, JSON.stringify({ id: seat.id, token: seat.token }));
    else localStorage.removeItem(SEAT_KEY);
  } catch {}
}

/** Applies one move and works out whether the game is over. */
function play(game: Game, col: number): Game | null {
  const result = drop(game.board, col, game.turn);
  if (!result) return null;
  const win = findWin(result.board);
  return {
    ...game,
    board: result.board,
    turn: game.turn === YOU ? BOT : YOU,
    last: { index: result.row * COLS + col, rows: result.row + 1 },
    win,
    draw: !win && isFull(result.board),
  };
}

// Glossy, glowing discs: a light highlight top-left over the base colour. Seat 1 is coral, seat 2 amber.
const discColor: Record<Player, string> = {
  1: "bg-[radial-gradient(circle_at_32%_28%,#ff9a8a_0%,#ff4d4d_45%,#d92f3a_100%)] shadow-[0_0_14px_rgb(255_77_77/0.45)]",
  2: "bg-[radial-gradient(circle_at_32%_28%,#ffe08a_0%,#ffb800_45%,#e08e00_100%)] shadow-[0_0_14px_rgb(255_184_0/0.45)]",
};

const pill =
  "flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-900 dark:hover:text-neutral-300";

function BoardView({
  board,
  last,
  winCells,
  over,
  canPlay,
  me,
  onMove,
}: {
  board: Board;
  last: { index: number; rows: number } | null;
  winCells: number[] | null;
  over: boolean;
  canPlay: boolean;
  me: Player;
  onMove: (col: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const ghostRow = hover !== null && canPlay ? landingRow(board, hover) : -1;

  return (
    <div className="rounded-xl bg-white p-1.5 shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_10px_28px_-10px_rgb(0_0_0/0.22)] dark:bg-neutral-900 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_10px_28px_-10px_rgb(0_0_0/0.9)]">
      {/* Columns are the buttons; overflow-hidden lets discs fall in from above the board. */}
      <div className="grid grid-cols-7 gap-1 overflow-hidden rounded-lg" onMouseLeave={() => setHover(null)}>
        {Array.from({ length: COLS }, (_, col) => (
          <button
            key={col}
            type="button"
            onClick={() => onMove(col)}
            onMouseEnter={() => setHover(col)}
            onFocus={() => setHover(col)}
            disabled={!canPlay || board[col] !== 0}
            aria-label={`Drop a disc in column ${col + 1}`}
            className="group/col flex cursor-pointer flex-col gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:cursor-default"
          >
            {Array.from({ length: ROWS }, (_, row) => {
              const i = row * COLS + col;
              const cell = board[i];
              const isLast = last?.index === i;
              const winning = winCells?.includes(i);
              const style = isLast
                ? ({ "--rows": last!.rows, animationDuration: `${220 + last!.rows * 45}ms` } as CSSProperties)
                : undefined;
              return (
                <span
                  key={row}
                  className="relative aspect-square w-full rounded-full bg-neutral-100 shadow-[inset_0_2px_3px_rgb(0_0_0/0.12)] transition-colors group-hover/col:bg-neutral-200/70 group-disabled/col:group-hover/col:bg-neutral-100 dark:bg-neutral-950 dark:shadow-[inset_0_2px_3px_rgb(0_0_0/0.7)] dark:group-hover/col:bg-neutral-800 dark:group-disabled/col:group-hover/col:bg-neutral-950"
                >
                  {cell !== 0 && (
                    <span
                      key={isLast ? `last-${i}` : i}
                      className={`absolute inset-0 rounded-full transition-[opacity,transform] duration-300 ${discColor[cell]} ${
                        isLast ? "c4-drop" : ""
                      } ${over && winCells && !winning ? "opacity-35" : ""} ${winning ? "scale-[0.86]" : ""}`}
                      style={style}
                    >
                      {winning && <span className="absolute inset-[32%] rounded-full bg-white/90 shadow-sm" />}
                    </span>
                  )}
                  {cell === 0 && row === ghostRow && col === hover && (
                    <span className={`absolute inset-0 rounded-full opacity-30 ${discColor[me]}`} />
                  )}
                </span>
              );
            })}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Connect 4 under the GitHub graph. Visitors play a bot, and can challenge John: he gets pinged with a
 * private Join link, and when he joins they play live, with every move checked by the server.
 */
export function Connect4() {
  const hydrated = useHydrated();
  const [game, setGame] = useState<Game>(() => newGame(YOU));
  const [pickedLevel, setLevel] = useState<Difficulty | null>(null);
  const [score, setScore] = useState({ you: 0, bot: 0 });
  const [pickedOpen, setOpen] = useState<boolean | null>(null);

  // Live games
  const [me, setMe] = useState<{ live: boolean; owner: boolean } | null>(null);
  const [pickedSeat, setSeat] = useState<Seat | null | undefined>(undefined);
  const [pickedLiveView, setLiveView] = useState<boolean | null>(null);
  const [form, setForm] = useState<{ name: string; note: string; sending: boolean; error: string } | null>(null);
  const [moveError, setMoveError] = useState("");

  useEffect(() => {
    fetch("/api/c4/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ live: false, owner: false }));
  }, []);

  // John arrives from his Join link as /?play=<id>; a visitor's own game is remembered in this browser.
  const playParam = hydrated ? new URLSearchParams(window.location.search).get("play") : null;
  const ownerSeat: Seat | null = me?.owner && playParam ? { id: playParam, seat: 2 } : null;
  const seat = pickedSeat !== undefined ? pickedSeat : (ownerSeat ?? (hydrated ? storedSeat() : null));
  const [row, setRow] = useLiveGame(seat?.id ?? null);

  const liveView = Boolean(
    seat && row && row.status !== "waiting" && row.status !== "expired" && (pickedLiveView ?? (seat.seat === 2 || row.moves > 0)),
  );
  const open = pickedOpen ?? Boolean(ownerSeat);

  const level = pickedLevel ?? (hydrated ? storedLevel() : "medium");
  const over = Boolean(game.win) || game.draw;
  const thinking = open && !liveView && game.turn === BOT && !over;

  // The bot replies after a short, human-feeling pause.
  useEffect(() => {
    if (!thinking) return;
    const id = setTimeout(() => {
      const next = play(game, botMove(game.board, BOT, level));
      if (!next) return;
      playTick(0.7);
      setGame(next);
      if (next.win) setScore((s) => ({ ...s, bot: s.bot + 1 }));
    }, 450);
    return () => clearTimeout(id);
  }, [thinking, level, game]);

  // A tick when the opponent's disc lands in a live game.
  const lastMove = row?.last_move;
  const myTurnLive = Boolean(seat && row && row.turn === seat.seat);
  useEffect(() => {
    if (liveView && myTurnLive && lastMove != null) playTick(0.7);
  }, [liveView, myTurnLive, lastMove]);

  function move(col: number) {
    if (game.turn !== YOU || over) return;
    const next = play(game, col);
    if (!next) return;
    setGame(next);
    if (next.win) setScore((s) => ({ ...s, you: s.you + 1 }));
  }

  async function liveMove(col: number) {
    if (!seat || !row) return;
    setMoveError("");
    const res = await fetch("/api/c4/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: seat.id, col, token: seat.token }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data) setRow(data as GameRow);
    else setMoveError(data?.error ?? "That move didn't go through");
  }

  function restart() {
    // Whoever didn't start last time starts now.
    setGame((g) => newGame(g.starter === YOU ? BOT : YOU));
  }

  function changeLevel(l: Difficulty) {
    if (l === level) return;
    setLevel(l);
    try {
      localStorage.setItem(LEVEL_KEY, l);
    } catch {}
    setGame(newGame(YOU));
  }

  async function sendChallenge(e: FormEvent) {
    e.preventDefault();
    if (!form || form.sending) return;
    setForm({ ...form, sending: true, error: "" });
    const res = await fetch("/api/c4/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, note: form.note }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.id) {
      setForm({ ...form, sending: false, error: data?.error ?? "Couldn't reach John, try again" });
      return;
    }
    const next: Seat = { id: data.id, seat: 1, token: data.token };
    saveSeat(next);
    setSeat(next);
    setLiveView(null);
    setForm(null);
  }

  async function leave() {
    if (!seat) return;
    if (row && (row.status === "waiting" || row.status === "live")) {
      await fetch("/api/c4/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: seat.id, token: seat.token }),
      }).catch(() => {});
    }
    forget();
  }

  function forget() {
    if (seat?.seat === 1) saveSeat(null);
    setSeat(null);
    setLiveView(null);
    setMoveError("");
    if (seat?.seat === 2) window.history.replaceState(null, "", "/");
  }

  // ---------------------------------------------------------------- what to show
  const opponent = seat?.seat === 2 ? (row?.visitor_name ?? "Visitor") : "John";
  const liveOver = row?.status === "done";
  const waiting = Boolean(seat && row && row.status === "waiting" && !isExpired(row));
  const expired = Boolean(seat && row && (row.status === "expired" || (row.status === "waiting" && isExpired(row))));

  const status = liveView
    ? liveOver
      ? row!.winner === 0
        ? "Draw"
        : row!.winner === seat!.seat
          ? "You win"
          : `${opponent} wins`
      : myTurnLive
        ? "Your move"
        : `${opponent}'s move…`
    : game.win
      ? game.win.player === YOU
        ? "You win"
        : "Bot wins"
      : game.draw
        ? "Draw"
        : thinking
          ? "Bot is thinking…"
          : game.board.every((c) => c === 0)
            ? "Your move. Drop a disc"
            : "Your move";

  const finished = liveView ? liveOver : over;

  return (
    <section className="mt-8" aria-label="Connect 4">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 transition-all hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.98] dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-900"
        >
          <span className="flex -space-x-1" aria-hidden>
            <span className={`size-3 rounded-full ${discColor[1]}`} />
            <span className={`size-3 rounded-full ${discColor[2]}`} />
          </span>
          Play Connect 4
          <GameController size={14} weight="bold" className="text-neutral-400 transition-transform group-hover:rotate-12" />
        </button>
      )}

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        inert={!open}
      >
        <div className="-mx-3 -mb-6 min-h-0 overflow-hidden px-3 pb-6" /* room for the board outline and shadow */>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-neutral-400 dark:text-neutral-600">
              Connect 4 <span className="font-normal">· vs {liveView ? opponent : "bot"}</span>
            </h2>
            <div className="-mr-1.5 flex items-center text-xs" role="group" aria-label="Bot difficulty">
              {!liveView &&
                LEVELS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => changeLevel(l)}
                    aria-pressed={level === l}
                    className={`cursor-pointer rounded-md px-1.5 py-0.5 capitalize transition-colors duration-150 ${
                      level === l
                        ? "bg-neutral-100 font-medium text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                        : "text-neutral-400 hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-400"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close Connect 4"
                className="ml-1 flex size-5 cursor-pointer items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-600 dark:hover:bg-neutral-900 dark:hover:text-neutral-300"
              >
                <X size={12} weight="bold" />
              </button>
            </div>
          </div>

          {/* John sees who challenged him and what they wrote. */}
          {liveView && seat?.seat === 2 && row?.visitor_note && (
            <p className="mb-3 truncate text-xs text-neutral-500 dark:text-neutral-400">“{row.visitor_note}”</p>
          )}

          {liveView && row ? (
            <BoardView
              board={row.board}
              last={row.last_move != null ? { index: row.last_move, rows: Math.floor(row.last_move / COLS) + 1 } : null}
              winCells={row.win_cells}
              over={liveOver}
              canPlay={row.status === "live" && myTurnLive}
              me={seat!.seat}
              onMove={liveMove}
            />
          ) : (
            <BoardView
              board={game.board}
              last={game.last}
              winCells={game.win?.cells ?? null}
              over={over}
              canPlay={game.turn === YOU && !over}
              me={YOU}
              onMove={move}
            />
          )}

          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-neutral-400 dark:text-neutral-600">
            <span aria-live="polite" className={finished ? "font-medium text-neutral-700 dark:text-neutral-300" : undefined}>
              {status}
            </span>
            <span className="-mr-1.5 flex items-center gap-2">
              {liveView ? (
                liveOver ? (
                  <button type="button" onClick={forget} className={pill}>
                    Back to bot
                  </button>
                ) : (
                  <button type="button" onClick={leave} className={pill}>
                    Leave game
                  </button>
                )
              ) : (
                <>
                  <span className="tabular-nums" aria-label={`Score: you ${score.you}, bot ${score.bot}`}>
                    You {score.you} · Bot {score.bot}
                  </span>
                  <button type="button" onClick={restart} className={pill}>
                    <ArrowCounterClockwise size={12} weight="bold" />
                    New game
                  </button>
                </>
              )}
            </span>
          </div>

          {moveError && liveView && <p className="mt-1 text-xs text-[#d92f3a]">{moveError}</p>}

          {/* Challenge John: only when live games are set up and this visitor isn't already in one. */}
          {!liveView && me?.live && !me.owner && !seat && !form && (
            <button
              type="button"
              onClick={() => setForm({ name: "", note: "", sending: false, error: "" })}
              className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 py-2 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-900"
            >
              <span className={`size-2.5 rounded-full ${discColor[2]}`} aria-hidden />
              Challenge John to a live game
            </button>
          )}

          {form && (
            <form onSubmit={sendChallenge} className="mt-4 flex flex-col gap-2 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                John gets a ping and joins if he&apos;s around. Keep playing the bot meanwhile.
              </p>
              <input
                required
                maxLength={24}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                aria-label="Your name"
                autoFocus
                className="rounded-lg bg-white px-3 py-1.5 text-sm outline-none ring-1 ring-neutral-200 placeholder:text-neutral-400 focus:ring-neutral-400 dark:bg-neutral-950 dark:ring-neutral-800 dark:focus:ring-neutral-600"
              />
              <input
                maxLength={140}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="A note for John (optional)"
                aria-label="A note for John"
                className="rounded-lg bg-white px-3 py-1.5 text-sm outline-none ring-1 ring-neutral-200 placeholder:text-neutral-400 focus:ring-neutral-400 dark:bg-neutral-950 dark:ring-neutral-800 dark:focus:ring-neutral-600"
              />
              {form.error && <p className="text-xs text-[#d92f3a]">{form.error}</p>}
              <div className="flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => setForm(null)} className={`${pill} text-neutral-500`}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={form.sending}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                >
                  <PaperPlaneTilt size={12} weight="bold" />
                  {form.sending ? "Sending…" : "Ping John"}
                </button>
              </div>
            </form>
          )}

          {/* The visitor's challenge, while it waits, once John joins, or if it timed out. */}
          {!liveView && seat?.seat === 1 && row && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2.5 text-xs dark:bg-neutral-900">
              {waiting && (
                <>
                  <span className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <span className="relative flex size-2">
                      <span className="absolute inset-0 animate-ping rounded-full bg-[#ffb800] opacity-60" />
                      <span className="relative size-2 rounded-full bg-[#ffb800]" />
                    </span>
                    John&apos;s been pinged. Waiting for him…
                  </span>
                  <button type="button" onClick={leave} className={`${pill} text-neutral-500`}>
                    Cancel
                  </button>
                </>
              )}
              {row.status === "live" && (
                <>
                  <span className="flex items-center gap-2 font-medium text-neutral-800 dark:text-neutral-200">
                    <span className="size-2 rounded-full bg-[#2da44e]" />
                    John joined!
                  </span>
                  <button
                    type="button"
                    onClick={() => setLiveView(true)}
                    className="cursor-pointer rounded-lg bg-neutral-900 px-3 py-1 font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                  >
                    Play John
                  </button>
                </>
              )}
              {expired && (
                <>
                  <span className="text-neutral-600 dark:text-neutral-400">John couldn&apos;t make it this time.</span>
                  <button type="button" onClick={forget} className={`${pill} text-neutral-500`}>
                    OK
                  </button>
                </>
              )}
              {row.status === "done" && (
                <>
                  <span className="text-neutral-600 dark:text-neutral-400">Your game with John has ended.</span>
                  <button type="button" onClick={() => setLiveView(true)} className={`${pill} text-neutral-500`}>
                    See board
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
