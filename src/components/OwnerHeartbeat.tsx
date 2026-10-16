"use client";

import { useEffect } from "react";
import { refreshC4Status, useC4Status } from "@/lib/c4-status";

const BEAT_MS = 45_000;

/**
 * Renders nothing. In John's own browser it checks in while the tab is visible, so visitors see
 * a green dot, and signs off when the tab is hidden or closed.
 */
export function OwnerHeartbeat() {
  const { owner } = useC4Status();

  useEffect(() => {
    if (!owner) return;
    const send = (online: boolean) =>
      fetch("/api/c4/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ online }),
        keepalive: true,
      })
        .then(() => (online ? refreshC4Status() : undefined))
        .catch(() => {});

    const sync = () => void send(document.visibilityState === "visible");
    sync();
    const id = setInterval(
      () => document.visibilityState === "visible" && void send(true),
      BEAT_MS,
    );
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pagehide", () => void send(false));
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [owner]);

  return null;
}
