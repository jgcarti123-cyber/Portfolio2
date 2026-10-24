"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  ArrowCounterClockwise,
  ArrowRight,
  GameController,
  PaperPlaneTilt,
  Robot,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { isExpired, JOIN_WINDOW_MS, type GameRow } from "@/lib/c4-shared";
import { tellMascot } from "@/lib/mascot";
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
import { useC4Status } from "@/lib/c4-status";
import { useLiveGame } from "@/lib/use-live-game";
import { Turnstile } from "./Turnstile";

const YOU: Player = 1;
const BOT: Player = 2;
const LEVELS: Difficulty[] = ["easy", "medium", "hard"];
const LEVEL_KEY = "c4-level";
const SEAT_KEY = "c4-seat";
const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

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
    return s && typeof s.id === "string" && typeof s.token === "string"
      ? { id: s.id, seat: 1, token: s.token }
      : null;
  } catch {
    return null;
  }
}

function saveSeat(seat: Seat | null) {
  try {
    if (seat)
      localStorage.setItem(
        SEAT_KEY,
        JSON.stringify({ id: seat.id, token: seat.token }),
      );
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

const entryButton =
  "group flex min-w-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-medium text-neutral-700 transition-all hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.98] dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-900";

const card =
  "mb-3 rounded-xl bg-neutral-50 ring-1 ring-neutral-200/70 dark:bg-neutral-900 dark:ring-neutral-800";

const field =
  "w-full rounded-lg bg-white px-3 py-1.5 text-sm outline-none ring-1 ring-neutral-200 placeholder:text-neutral-400 focus:ring-neutral-400 dark:bg-neutral-950 dark:ring-neutral-800 dark:focus:ring-neutral-600";

const primaryButton =
  "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-default disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white";

const segment = (active: boolean) =>
  `relative flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors duration-200 ${
    active
      ? "text-neutral-800 dark:text-neutral-100"
      : "text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
  }`;

/** John as an amber disc (his colour on the board), with a status ring or dot. */
function JohnAvatar({
  state = "idle",
  online = false,
  small = false,
}: {
  state?: "idle" | "waiting" | "joined";
  online?: boolean;
  small?: boolean;
}) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${discColor[2]} ${small ? "size-4 text-[9px]" : "size-7 text-xs"}`}
      aria-hidden
    >
      J
      {state === "waiting" && (
        <span className="absolute -inset-1 rounded-full ring-2 ring-[#ffb800]/60 motion-safe:animate-ping" />
      )}
      {state === "joined" && (
        <span className="absolute -inset-1 rounded-full ring-2 ring-[#2da44e]" />
      )}
      {state === "idle" && online && (
        <span
          className={`absolute -right-0.5 -bottom-0.5 rounded-full bg-[#2da44e] ring-2 ring-white dark:ring-neutral-950 ${small ? "size-1.5" : "size-2.5"}`}
        />
      )}
    </span>
  );
}

/** The current time, ticking every second while `active`. */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [active]);
  return now;
}

const SWITCH_SECONDS = 3;

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
      <div
        className="grid grid-cols-7 gap-1 overflow-hidden rounded-lg"
        onMouseLeave={() => setHover(null)}
      >
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
                ? ({
                    "--rows": last!.rows,
                    animationDuration: `${220 + last!.rows * 45}ms`,
                  } as CSSProperties)
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
                      {winning && (
                        <span className="absolute inset-[32%] rounded-full bg-white/90 shadow-sm" />
                      )}
                    </span>
                  )}
                  {cell === 0 && row === ghostRow && col === hover && (
                    <span
                      className={`absolute inset-0 rounded-full opacity-30 ${discColor[me]}`}
                    />
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
 * Connect 4 under the GitHub graph. Visitors play a bot, or challenge John: he gets pinged with a private
 * Join link, they play the bot while they wait, and when he joins the board switches over to a live game
 * where the server checks every move.
 */
export function Connect4() {
  const hydrated = useHydrated();
  const [game, setGame] = useState<Game>(() => newGame(YOU));
  const [pickedLevel, setLevel] = useState<Difficulty | null>(null);
  const [score, setScore] = useState({ you: 0, bot: 0 });
  const [pickedOpen, setOpen] = useState<boolean | null>(null);

  // Live games
  const me = useC4Status();
  const [pickedSeat, setSeat] = useState<Seat | null | undefined>(undefined);
  const [pickedLiveView, setLiveView] = useState<boolean | null>(null);
  const [form, setForm] = useState<{
    name: string;
    note: string;
    sending: boolean;
    error: string;
    turnstile: string | null;
  } | null>(null);
  const [moveError, setMoveError] = useState("");
  const sending = useRef(false); // a live move is on its way to the server
  const [checkKey, setCheckKey] = useState(0); // bumps to re-render the human check after a failed attempt

  // John arrives from his Join link as /?play=<id>; a visitor's own game is remembered in this browser.
  const playParam = hydrated
    ? new URLSearchParams(window.location.search).get("play")
    : null;
  const ownerSeat: Seat | null =
    me.owner && playParam ? { id: playParam, seat: 2 } : null;
  const seat =
    pickedSeat !== undefined
      ? pickedSeat
      : (ownerSeat ?? (hydrated ? storedSeat() : null));
  const [row, setRow] = useLiveGame(seat?.id ?? null);

  const liveView = Boolean(
    seat &&
    row &&
    row.status !== "waiting" &&
    row.status !== "expired" &&
    (pickedLiveView ?? (seat.seat === 2 || row.moves > 0)),
  );
  // A visitor's challenge, from the moment it's sent until they're on the live board.
  const waiting = Boolean(
    seat && row && row.status === "waiting" && !isExpired(row),
  );
  const joined = Boolean(
    seat?.seat === 1 && row?.status === "live" && !liveView,
  );
  const open = pickedOpen ?? Boolean(ownerSeat || waiting || joined);

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
      if (next.win || next.draw) tellMascot({ type: "c4", result: next.win ? "lose" : "draw", level });
    }, 450);
    return () => clearTimeout(id);
  }, [thinking, level, game]);

  // A tick when the opponent's disc lands in a live game.
  const lastMove = row?.last_move;
  const myTurnLive = Boolean(seat && row && row.turn === seat.seat);
  useEffect(() => {
    if (liveView && myTurnLive && lastMove != null) playTick(0.7);
  }, [liveView, myTurnLive, lastMove]);

  // When John joins, the visitor's bot game hands over to the live one after a short countdown.
  const [switchIn, setSwitchIn] = useState(SWITCH_SECONDS);
  useEffect(() => {
    if (!joined) return;
    playTick(1.3);
    let n = SWITCH_SECONDS;
    const id = setInterval(() => {
      n -= 1;
      setSwitchIn(n);
      if (n <= 0) {
        clearInterval(id);
        setOpen(true);
        setLiveView(true);
      }
    }, 1000);
    return () => {
      clearInterval(id);
      setSwitchIn(SWITCH_SECONDS);
    };
  }, [joined]);

  // Ticks the "time left" on a waiting challenge, and lets it expire on screen.
  const now = useNow(waiting);

  function move(col: number) {
    if (game.turn !== YOU || over) return;
    const next = play(game, col);
    if (!next) return;
    setGame(next);
    if (next.win) setScore((s) => ({ ...s, you: s.you + 1 }));
    if (next.win || next.draw) tellMascot({ type: "c4", result: next.win ? "win" : "draw", level });
  }

  async function liveMove(col: number) {
    if (!seat || !row || sending.current) return;
    if (row.status !== "live" || row.turn !== seat.seat) return;
    const result = drop(row.board, col, seat.seat);
    if (!result) return;
    const before = row;
    const win = findWin(result.board);
    const draw = !win && isFull(result.board);
    setMoveError("");
    sending.current = true;
    // Drop the disc straight away and hand the turn over; the server's answer confirms it a moment
    // later. This also locks the board, so a second tap can't fire a second move.
    setRow({
      ...row,
      board: result.board,
      turn: seat.seat === 1 ? 2 : 1,
      last_move: result.row * COLS + col,
      moves: row.moves + 1,
      ...(win
        ? { status: "done", winner: win.player, win_cells: win.cells }
        : {}),
      ...(draw ? { status: "done", winner: 0 } : {}),
    });
    try {
      const res = await fetch("/api/c4/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: seat.id, col, token: seat.token }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        setRow(data as GameRow);
      } else {
        // Undo to the server's real board. A 409 only means this board was behind, so catch up quietly.
        setRow((data?.row as GameRow | undefined) ?? before);
        if (res.status !== 409)
          setMoveError(data?.error ?? "That move didn't go through. Try again");
      }
    } catch {
      setRow(before);
      setMoveError("Connection hiccup. Try that move again");
    } finally {
      sending.current = false;
    }
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

  function openChallenge() {
    setOpen(true);
    if (!seat && !form)
      setForm({ name: "", note: "", sending: false, error: "", turnstile: null });
  }

  // The opponent switch. A live game in progress has to be left from the footer, not by a stray tap here.
  function pickBot() {
    if (!liveView) setForm(null);
    else if (row?.status === "done") forget();
  }

  function pickJohn() {
    if (liveView) return;
    if (seat?.seat === 1 && (row?.status === "live" || row?.status === "done"))
      setLiveView(true);
    else openChallenge();
  }

  async function sendChallenge(e: FormEvent) {
    e.preventDefault();
    if (!form || form.sending) return;
    setForm({ ...form, sending: true, error: "" });
    const res = await fetch("/api/c4/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        note: form.note,
        turnstile: form.turnstile,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.id) {
      // The human-check token is single use: ask for a fresh one before they try again.
      setForm({
        ...form,
        sending: false,
        turnstile: null,
        error: data?.error ?? "Couldn't reach John, try again",
      });
      setCheckKey((k) => k + 1);
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
  const canChallenge = !me.loaded || (me.live && !me.owner);
  const timeLeft =
    waiting && row
      ? Math.max(
          0,
          JOIN_WINDOW_MS - (now - new Date(row.created_at).getTime()),
        )
      : 0;
  const clock = `${Math.floor(timeLeft / 60_000)}:${String(Math.floor(timeLeft / 1000) % 60).padStart(2, "0")}`;
  const expired = Boolean(
    seat &&
    row &&
    (row.status === "expired" || (row.status === "waiting" && isExpired(row))),
  );

  // The switch shows John's side from the moment a challenge starts; the board stays a warm-up against
  // the bot until he joins, and the status line says so.
  const warmingUp = !liveView && Boolean(form || waiting || joined);
  const johnSide = liveView || warmingUp;

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
          : warmingUp
            ? "Warm-up vs bot"
            : game.board.every((c) => c === 0)
            ? "Your move. Drop a disc"
            : "Your move";

  const finished = liveView ? liveOver : over;

  return (
    <section data-ground className="mt-8" aria-label="Connect 4">
      {!open && (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`${entryButton} w-full`}
          >
            <span className="flex shrink-0 -space-x-1" aria-hidden>
              <span className={`size-3 rounded-full ${discColor[1]}`} />
              <span className={`size-3 rounded-full ${discColor[2]}`} />
            </span>
            Play Connect 4
            <GameController
              size={14}
              weight="bold"
              className="shrink-0 text-neutral-400 transition-transform group-hover:rotate-12"
            />
          </button>
          {/* Under the button, in the same rhythm as the graph's footer: John's status, and a way straight into a challenge. */}
          {canChallenge && (
            <div className="mt-2 flex items-center justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-center gap-1.5 text-neutral-400 dark:text-neutral-600">
                {(waiting || joined || me.online) && (
                  <span className="relative flex size-1.5 shrink-0" aria-hidden>
                    {waiting && (
                      <span className="absolute inset-0 rounded-full bg-[#ffb800] opacity-60 motion-safe:animate-ping" />
                    )}
                    <span
                      className={`relative size-1.5 rounded-full ${waiting ? "bg-[#ffb800]" : "bg-[#2da44e]"}`}
                    />
                  </span>
                )}
                <span className="truncate">
                  {waiting ? (
                    <>
                      John&apos;s been pinged{" "}
                      <span className="tabular-nums">· {clock}</span>
                    </>
                  ) : joined ? (
                    "John joined!"
                  ) : me.online ? (
                    "John's online now"
                  ) : (
                    "Prefer a real opponent?"
                  )}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setOpen(true);
                  pickJohn();
                }}
                className="group/challenge -mr-1.5 flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-200"
              >
                {waiting ? "Open game" : joined ? "Play now" : "Challenge John"}
                <ArrowRight
                  size={11}
                  weight="bold"
                  className="transition-transform group-hover/challenge:translate-x-0.5"
                />
              </button>
            </div>
          )}
        </>
      )}

      <div
        className={`grid transition-[grid-template-rows,margin] duration-300 ease-out ${open ? "-mb-6 grid-rows-[1fr]" : "mb-0 grid-rows-[0fr]"}`}
        inert={!open}
      >
        <div className="-mx-3 min-h-0 overflow-hidden">
          {/* Room for the board outline and shadow; it lives inside the clipped row so nothing peeks out when closed. */}
          <div className="px-3 pb-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              {canChallenge || liveView ? (
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="text-xs text-neutral-400 dark:text-neutral-600">
                    vs
                  </span>
                  {/* Who's on the other side of the board; the highlight slides to the live game when it starts. */}
                  <div
                    role="radiogroup"
                    aria-label="Opponent"
                    className="relative inline-grid min-w-0 grid-cols-2 rounded-lg bg-neutral-100 p-0.5 text-xs dark:bg-neutral-900"
                  >
                    <span
                      aria-hidden
                      className={`absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-md bg-white shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_1px_rgb(0_0_0/0.04)] transition-transform duration-300 ease-out dark:bg-neutral-800 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.06)] ${johnSide ? "translate-x-full" : ""}`}
                    />
                    <button
                      type="button"
                      role="radio"
                      aria-checked={!johnSide}
                      onClick={pickBot}
                      title={
                        liveView && !liveOver
                          ? "Finish or leave this game first"
                          : waiting
                            ? "You're playing the bot while John's on his way"
                            : undefined
                      }
                      className={segment(!johnSide)}
                    >
                      <Robot size={13} weight="bold" className="shrink-0" />
                      Bot
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={johnSide}
                      onClick={pickJohn}
                      className={segment(johnSide)}
                    >
                      {seat?.seat === 2 ? (
                        <span
                          className={`size-3 shrink-0 rounded-full ${discColor[1]}`}
                          aria-hidden
                        />
                      ) : (
                        <JohnAvatar
                          small
                          online={me.online}
                          state={
                            waiting ? "waiting" : joined ? "joined" : "idle"
                          }
                        />
                      )}
                      <span className="max-w-20 truncate">
                        {liveView ? opponent : "John"}
                      </span>
                      {liveView && !liveOver && (
                        <span
                          className="size-1.5 shrink-0 rounded-full bg-[#ff4d4d] motion-safe:animate-pulse"
                          role="img"
                          aria-label="Live"
                        />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <h2 className="text-xs font-semibold text-neutral-400 dark:text-neutral-600">
                  Connect 4 <span className="font-normal">· vs bot</span>
                </h2>
              )}
              <div className="-mr-1.5 ml-auto flex items-center text-[11px]">
                {!liveView && (
                  <div
                    className="flex items-center"
                    role="group"
                    aria-label="Bot difficulty"
                  >
                    {LEVELS.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => changeLevel(l)}
                        aria-pressed={level === l}
                        className={`cursor-pointer rounded-md px-1 py-0.5 capitalize transition-colors duration-150 ${
                          level === l
                            ? "font-medium text-neutral-700 dark:text-neutral-300"
                            : "text-neutral-400 hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-400"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                )}
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
              <p className="mb-3 truncate text-xs text-neutral-500 dark:text-neutral-400">
                “{row.visitor_note}”
              </p>
            )}

            {/* Challenging John: the form, then the challenge while it waits, once he joins, or if it timed out. */}
            {form && !liveView && (
              <form
                onSubmit={sendChallenge}
                className={`${card} c4-card-in p-3`}
              >
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {me.online ? (
                      <>
                        <span className="text-[#2da44e] dark:text-[#39d353]">
                          John&apos;s online.
                        </span>{" "}
                        He&apos;ll get a ping on his phone.
                      </>
                    ) : (
                      "John's away, but he'll get a ping on his phone."
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => setForm(null)}
                    aria-label="Cancel challenge"
                    className="-mr-1 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-200/60 hover:text-neutral-700 dark:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                  >
                    <X size={11} weight="bold" />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    required
                    maxLength={24}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    aria-label="Your name"
                    autoFocus
                    className={field}
                  />
                  <input
                    maxLength={140}
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="Say hi (optional)"
                    aria-label="A note for John"
                    className={field}
                  />
                  {me.human && TURNSTILE_SITE_KEY && (
                    <Turnstile
                      key={checkKey}
                      siteKey={TURNSTILE_SITE_KEY}
                      onToken={(t) =>
                        setForm((f) => (f ? { ...f, turnstile: t } : f))
                      }
                    />
                  )}
                  {form.error && (
                    <p className="text-xs text-[#d92f3a]">{form.error}</p>
                  )}
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-3">
                  <p className="text-xs leading-snug text-neutral-500 dark:text-neutral-400">
                    You&apos;ll play the bot till he joins.
                  </p>
                  <button
                    type="submit"
                    disabled={
                      form.sending ||
                      (me.human && Boolean(TURNSTILE_SITE_KEY) && !form.turnstile)
                    }
                    className={primaryButton}
                  >
                    <PaperPlaneTilt size={12} weight="bold" />
                    {form.sending
                      ? "Sending…"
                      : me.human && TURNSTILE_SITE_KEY && !form.turnstile
                        ? "Checking…"
                        : "Ping John"}
                  </button>
                </div>
                <p className="mt-2.5 text-[10px] leading-snug text-neutral-400 dark:text-neutral-600">
                  Saves your name, note and moves for this game, plus a one-way
                  hash of your connection to limit spam (one challenge every 5
                  minutes).
                </p>
              </form>
            )}

            {!liveView && seat?.seat === 1 && row && (
              <div
                key={row.status}
                className={`${card} c4-card-in flex items-center gap-3 px-3 py-2.5`}
                role="status"
              >
                {waiting && (
                  <>
                    <JohnAvatar state="waiting" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-neutral-800 dark:text-neutral-200">
                        John&apos;s been pinged{" "}
                        <span className="font-normal tabular-nums text-neutral-400 dark:text-neutral-600">
                          · {clock}
                        </span>
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Play the bot till he joins.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={leave}
                      className={`${pill} -mr-1 shrink-0 text-xs text-neutral-500`}
                    >
                      Cancel
                    </button>
                  </>
                )}
                {joined && (
                  <>
                    <JohnAvatar state="joined" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-neutral-800 dark:text-neutral-200">
                        John joined!
                      </p>
                      <p className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                        Switching over in {Math.max(switchIn, 1)}…
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLiveView(true)}
                      className={primaryButton}
                    >
                      Play now
                      <ArrowRight size={12} weight="bold" />
                    </button>
                  </>
                )}
                {expired && (
                  <>
                    <JohnAvatar />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-neutral-800 dark:text-neutral-200">
                        John couldn&apos;t make it
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Try him again later.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={forget}
                      className={`${pill} -mr-1 shrink-0 text-xs text-neutral-500`}
                    >
                      OK
                    </button>
                  </>
                )}
                {row.status === "done" && (
                  <>
                    <JohnAvatar />
                    <p className="min-w-0 flex-1 text-[13px] text-neutral-600 dark:text-neutral-400">
                      Your game with John has ended.
                    </p>
                    <button
                      type="button"
                      onClick={() => setLiveView(true)}
                      className={`${pill} -mr-1 shrink-0 text-xs text-neutral-500`}
                    >
                      See board
                    </button>
                  </>
                )}
              </div>
            )}

            {liveView && row ? (
              <BoardView
                board={row.board}
                last={
                  row.last_move != null
                    ? {
                        index: row.last_move,
                        rows: Math.floor(row.last_move / COLS) + 1,
                      }
                    : null
                }
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
              <span
                aria-live="polite"
                className={
                  finished
                    ? "font-medium text-neutral-700 dark:text-neutral-300"
                    : undefined
                }
              >
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
                    <span
                      className="tabular-nums"
                      aria-label={`Score: you ${score.you}, bot ${score.bot}`}
                    >
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

            {moveError && liveView && (
              <p className="mt-1 text-xs text-[#d92f3a]">{moveError}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
