"use client";

import { useState } from "react";
import { Check, Copy } from "@phosphor-icons/react/dist/ssr";
import { inlineLink } from "./InlineLink";

export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <span className="whitespace-nowrap">
      <a href={`mailto:${email}`} className={inlineLink}>
        {email}
      </a>
      <button
        type="button"
        onClick={copy}
        className="relative ml-1 inline-flex size-5 translate-y-[3px] cursor-pointer items-center justify-center rounded text-neutral-400 transition-colors hover:text-neutral-700 dark:text-neutral-600 dark:hover:text-neutral-300"
        aria-label={copied ? "Email copied" : "Copy email"}
      >
        <span key={String(copied)} className="blur-in">
          {copied ? <Check size={13} weight="bold" /> : <Copy size={13} weight="bold" />}
        </span>
      </button>
    </span>
  );
}
