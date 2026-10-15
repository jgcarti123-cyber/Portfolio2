"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  ArrowCounterClockwise,
  GameController,
  X,
} from "@phosphor-icons/react/dist/ssr";
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

const YOU: Player = 1;
const BOT: Player = 2;
const LEVELS: Difficulty[] = ["easy", "medium", "hard"];
const LEVEL_KEY = "c4-level";

type Game = {
  board: Board;
  turn: Player;
  starter: Player;
  last: { index: number; rows: number } | null;
  win: { player: Player; cells: number[] } | null;
  draw: boolean;
};

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

// Glossy, glowing discs: a light highlight top-left over the base colour.
const discColor: Record<Player, string> = {
  [YOU]:
    "bg-[radial-gradient(circle_at_32%_28%,#ff9a8a_0%,#ff4d4d_45%,#d92f3a_100%)] shadow-[0_0_14px_rgb(255_77_77/0.45)]",
  [BOT]:
    "bg-[radial-gradient(circle_at_32%_28%,#ffe08a_0%,#ffb800_45%,#e08e00_100%)] shadow-[0_0_14px_rgb(255_184_0/0.45)]",
};

/** Connect 4 against a bot, under the GitHub graph. Phase 2 adds live games against John. */
export function Connect4() {
  const hydrated = useHydrated();
  const [game, setGame] = useState<Game>(() => newGame(YOU));
  const [pickedLevel, setLevel] = useState<Difficulty | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [score, setScore] = useState({ you: 0, bot: 0 });
  const [open, setOpen] = useState(false);

  const level = pickedLevel ?? (hydrated ? storedLevel() : "medium");
  const over = Boolean(game.win) || game.draw;
  const thinking = open && game.turn === BOT && !over;

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

  function move(col: number) {
    if (game.turn !== YOU || over) return;
    const next = play(game, col);
    if (!next) return;
    setGame(next);
    if (next.win) setScore((s) => ({ ...s, you: s.you + 1 }));
  }

  function restart() {
    // Whoever didn't start last time starts now.
    setGame((g) => newGame(g.starter === YOU ? BOT : YOU));
    setHover(null);
  }

  function changeLevel(l: Difficulty) {
    if (l === level) return;
    setLevel(l);
    try {
      localStorage.setItem(LEVEL_KEY, l);
    } catch {}
    setGame(newGame(YOU));
    setHover(null);
  }

  const status = game.win
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

  const ghostRow =
    hover !== null && game.turn === YOU && !over
      ? landingRow(game.board, hover)
      : -1;

  return (
    <section className="mt-8" aria-label="Connect 4 against a bot">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 transition-all hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.98] dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-900"
        >
          <span className="flex -space-x-1" aria-hidden>
            <span className={`size-3 rounded-full ${discColor[YOU]}`} />
            <span className={`size-3 rounded-full ${discColor[BOT]}`} />
          </span>
          Play Connect 4
          <GameController
            size={14}
            weight="bold"
            className="text-neutral-400 transition-transform group-hover:rotate-12"
          />
        </button>
      )}

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        inert={!open}
      >
        <div className="-mx-3 -mb-6 min-h-0 overflow-hidden px-3 pb-6" /* room for the board outline and shadow */>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-neutral-400 dark:text-neutral-600">
              Connect 4 <span className="font-normal">· vs bot</span>
            </h2>
            <div
              className="-mr-1.5 flex items-center text-xs"
              role="group"
              aria-label="Bot difficulty"
            >
              {LEVELS.map((l) => (
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

          <div className="rounded-xl bg-white p-1.5 shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_10px_28px_-10px_rgb(0_0_0/0.22)] dark:bg-neutral-900 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_10px_28px_-10px_rgb(0_0_0/0.9)]">
            {/* Columns are the buttons; overflow-hidden lets discs fall in from above the board. */}
            <div
              className="grid grid-cols-7 gap-1 overflow-hidden rounded-lg"
              onMouseLeave={() => setHover(null)}
            >
              {Array.from({ length: COLS }, (_, col) => {
                const full = game.board[col] !== 0;
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => move(col)}
                    onMouseEnter={() => setHover(col)}
                    onFocus={() => setHover(col)}
                    disabled={full || over || game.turn !== YOU}
                    aria-label={`Drop a disc in column ${col + 1}`}
                    className="group/col flex cursor-pointer flex-col gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:cursor-default"
                  >
                    {Array.from({ length: ROWS }, (_, row) => {
                      const i = row * COLS + col;
                      const cell = game.board[i];
                      const isLast = game.last?.index === i;
                      const winning = game.win?.cells.includes(i);
                      const style = isLast
                        ? ({
                            "--rows": game.last!.rows,
                            animationDuration: `${220 + game.last!.rows * 45}ms`,
                          } as CSSProperties)
                        : undefined;
                      return (
                        <span
                          key={row}
                          className="relative aspect-square w-full rounded-full bg-neutral-100 shadow-[inset_0_2px_3px_rgb(0_0_0/0.12)] transition-colors group-hover/col:bg-neutral-200/70 group-disabled/col:group-hover/col:bg-neutral-100 dark:bg-neutral-950 dark:shadow-[inset_0_2px_3px_rgb(0_0_0/0.7)] dark:group-hover/col:bg-neutral-800 dark:group-disabled/col:group-hover/col:bg-neutral-950"
                        >
                          {cell !== 0 && (
                            <span
                              className={`absolute inset-0 rounded-full transition-[opacity,transform] duration-300 ${discColor[cell]} ${
                                isLast ? "c4-drop" : ""
                              } ${over && game.win && !winning ? "opacity-35" : ""} ${winning ? "scale-[0.86]" : ""}`}
                              style={style}
                            >
                              {winning && (
                                <span className="absolute inset-[32%] rounded-full bg-white/90 shadow-sm" />
                              )}
                            </span>
                          )}
                          {cell === 0 && row === ghostRow && col === hover && (
                            <span
                              className={`absolute inset-0 rounded-full opacity-30 ${discColor[YOU]}`}
                            />
                          )}
                        </span>
                      );
                    })}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-neutral-400 dark:text-neutral-600">
            <span
              aria-live="polite"
              className={
                over
                  ? "font-medium text-neutral-700 dark:text-neutral-300"
                  : undefined
              }
            >
              {status}
            </span>
            <span className="flex items-center gap-3">
              <span
                className="tabular-nums"
                aria-label={`Score: you ${score.you}, bot ${score.bot}`}
              >
                You {score.you} · Bot {score.bot}
              </span>
              <button
                type="button"
                onClick={restart}
                className="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 -mr-1.5 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-900 dark:hover:text-neutral-300"
              >
                <ArrowCounterClockwise size={12} weight="bold" />
                New game
              </button>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
