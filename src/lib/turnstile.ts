import "server-only";

const secret = () =>
  (process.env.TURNSTILE_SECRET_KEY ?? "").trim().replace(/^["']|["']$/g, "");

export const turnstileRequired = () => Boolean(secret());

/** Verifies a Cloudflare Turnstile token. When no secret is configured the check is skipped. */
export async function verifyTurnstile(
  token: unknown,
  ip: string | null,
): Promise<boolean> {
  if (!turnstileRequired()) return true;
  if (typeof token !== "string" || !token) return false;
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret: secret(),
          response: token,
          ...(ip ? { remoteip: ip } : {}),
        }),
      },
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (e) {
    console.error("[connect4] turnstile verification failed:", e);
    return false;
  }
}
