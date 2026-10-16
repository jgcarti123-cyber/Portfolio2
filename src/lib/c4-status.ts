"use client";

import { useSyncExternalStore } from "react";

// One shared, lightly polled copy of /api/c4/me for the whole page: whether live games exist,
// whether this browser is John's, whether John is online, and whether a human check is required.

export type C4Status = {
  loaded: boolean;
  live: boolean;
  owner: boolean;
  online: boolean;
  human: boolean;
};

const initial: C4Status = {
  loaded: false,
  live: false,
  owner: false,
  online: false,
  human: false,
};
let state = initial;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
const POLL_MS = 45_000;

export async function refreshC4Status() {
  let next: C4Status;
  try {
    const res = await fetch("/api/c4/me", { cache: "no-store" });
    next = { ...initial, ...(await res.json()), loaded: true };
  } catch {
    next = { ...state, loaded: true };
  }
  // Only notify when something changed, so idle polls don't re-render the page.
  if (JSON.stringify(next) !== JSON.stringify(state)) {
    state = next;
    listeners.forEach((l) => l());
  }
}

const onVisible = () => {
  if (document.visibilityState === "visible") void refreshC4Status();
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    void refreshC4Status();
    timer = setInterval(onVisible, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

export const useC4Status = () =>
  useSyncExternalStore(
    subscribe,
    () => state,
    () => initial,
  );
