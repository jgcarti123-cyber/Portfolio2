import { NextResponse, type NextRequest } from "next/server";
import {
  isOwner,
  liveGamesConfigured,
  OWNER_COOKIE,
  ownerOnline,
} from "@/lib/c4-server";
import { turnstileRequired } from "@/lib/turnstile";

export const dynamic = "force-dynamic";

/** Whether live games are available, whether this browser is John's, and whether John is online. */
export async function GET(req: NextRequest) {
  const live = liveGamesConfigured();
  const online = live ? await ownerOnline().catch(() => false) : false;
  return NextResponse.json(
    {
      live,
      owner: live && isOwner(req.cookies.get(OWNER_COOKIE)?.value),
      online,
      human: turnstileRequired(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
