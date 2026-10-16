"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

let script: Promise<void> | undefined;
function loadScript() {
  script ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Turnstile failed to load"));
    document.head.appendChild(s);
  });
  return script;
}

/** Cloudflare's human check. Mostly invisible: it only shows something when it is unsure. */
export function Turnstile({ siteKey, onToken }: { siteKey: string; onToken: (token: string | null) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const report = useRef(onToken);

  // Keep the latest callback without re-creating the widget every render.
  useEffect(() => {
    report.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let widget: string | undefined;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile) return;
        widget = window.turnstile.render(box.current, {
          sitekey: siteKey,
          appearance: "interaction-only",
          theme: "auto",
          callback: (t: string) => report.current(t),
          "expired-callback": () => report.current(null),
          "error-callback": () => report.current(null),
        });
      })
      .catch(() => report.current(null));
    return () => {
      cancelled = true;
      if (widget) window.turnstile?.remove(widget);
    };
  }, [siteKey]);

  return <div ref={box} />;
}
