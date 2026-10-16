import "server-only";

// Telegram pings for John. Bot token and chat id come from the environment; without them the
// challenge is only logged, which is how local development works.

const env = (name: string) =>
  (process.env[name] ?? "").trim().replace(/^["']|["']$/g, "");

export const telegramConfigured = () =>
  Boolean(env("TELEGRAM_BOT_TOKEN") && env("TELEGRAM_CHAT_ID"));

/** Visitors type these, so anything going into an HTML message must be escaped. */
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Sends a message to John. Returns false (and logs) when Telegram refuses it. */
export async function sendTelegram(
  text: string,
  button?: { label: string; url: string },
): Promise<boolean> {
  const token = env("TELEGRAM_BOT_TOKEN");
  const chat = env("TELEGRAM_CHAT_ID");
  if (!token || !chat) return false;

  // Telegram only accepts https links on buttons, so local http links go in the text instead.
  const buttonOk = button && button.url.startsWith("https://");
  const body = {
    chat_id: chat,
    text: button && !buttonOk ? `${text}\n\n${esc(button.url)}` : text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(buttonOk
      ? {
          reply_markup: {
            inline_keyboard: [[{ text: button.label, url: button.url }]],
          },
        }
      : {}),
  };

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      console.error(
        "[connect4] telegram refused the message:",
        res.status,
        (await res.text()).slice(0, 200),
      );
      return false;
    }
    return true;
  } catch (e) {
    console.error("[connect4] telegram request failed:", e);
    return false;
  }
}

/** The ping John gets when a visitor challenges him. */
export function challengeMessage(name: string, note: string | null) {
  return `🎮 <b>${esc(name)}</b> wants to play Connect 4${note ? `\n“${esc(note)}”` : ""}\n\nTap Join to play. The link works for 15 minutes.`;
}
