"use client";

import { useEffect, useState } from "react";
import type { GameRow } from "./c4-shared";
import { supabaseBrowser } from "./supabase-browser";

let subscriptions = 0;

/** Follows one live game: loads it, then applies every change Supabase pushes. */
export function useLiveGame(id: string | null) {
  const [row, setRow] = useState<GameRow | null>(null);

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
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "c4_games", filter: `id=eq.${id}` }, (p) => {
          // Ignore out-of-order deliveries: the move count only ever goes up.
          setRow((prev) => (prev && (p.new as GameRow).moves < prev.moves ? prev : (p.new as GameRow)));
        })
        .subscribe();
    } catch {
      // Live updates are a nicety: if they can't start, the board still works through moves and reloads.
    }
    return () => {
      alive = false;
      if (channel) void sb.removeChannel(channel);
    };
  }, [id]);

  return [row && row.id === id ? row : null, setRow] as const;
}
