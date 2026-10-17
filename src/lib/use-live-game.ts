"use client";

import { useEffect, useState } from "react";
import { newer, type GameRow } from "./c4-shared";
import { supabaseBrowser } from "./supabase-browser";

let subscriptions = 0;

// Realtime pushes changes instantly; this light poll is the safety net if a push is missed or the
// socket drops (phones going to sleep, flaky Wi-Fi), so a board can never stay stuck.
const POLL_LIVE_MS = 2500;
const POLL_WAITING_MS = 5000;

/** Follows one live game: loads it, applies every change Supabase pushes, and polls as a fallback. */
export function useLiveGame(id: string | null) {
  const [row, setRow] = useState<GameRow | null>(null);
  const status = row && row.id === id ? row.status : null;

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!id || !sb) return;
    let alive = true;
    sb.from("c4_games")
      .select("*")
      .eq("id", id)
      .single<GameRow>()
      .then(({ data }) => alive && setRow(data ?? null));
    // A fresh topic per subscription: Supabase returns an existing channel for a repeated name, and
    // React mounts effects twice in development, which would add listeners after subscribe() and throw.
    let channel: ReturnType<typeof sb.channel> | null = null;
    try {
      channel = sb
        .channel(`c4:${id}:${(subscriptions += 1)}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "c4_games",
            filter: `id=eq.${id}`,
          },
          (p) => setRow((prev) => newer(prev, p.new as GameRow)),
        )
        .subscribe();
    } catch {
      // Live updates are a nicety: the poll below keeps the board in step without them.
    }
    return () => {
      alive = false;
      if (channel) void sb.removeChannel(channel);
    };
  }, [id]);

  // The fallback poll, only while something can still change, plus an instant check on coming back to the tab.
  useEffect(() => {
    const sb = supabaseBrowser();
    if (!id || !sb || (status !== "live" && status !== "waiting")) return;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      void sb
        .from("c4_games")
        .select("*")
        .eq("id", id)
        .single<GameRow>()
        .then(({ data }) => data && setRow((prev) => newer(prev, data)));
    };
    const timer = setInterval(
      refresh,
      status === "live" ? POLL_LIVE_MS : POLL_WAITING_MS,
    );
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [id, status]);

  return [row && row.id === id ? row : null, setRow] as const;
}
