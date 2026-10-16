import { NextResponse, type NextRequest } from "next/server";
import {
  guarded,
  isOwner,
  liveGamesConfigured,
  OWNER_COOKIE,
  setOwnerOnline,
} from "@/lib/c4-server";

/** John's browser checks in while his tab is open (online) or signs off (offline). */
export async function POST(req: NextRequest) {
  return guarded("heartbeat", async () => {
    if (
      !liveGamesConfigured() ||
      !isOwner(req.cookies.get(OWNER_COOKIE)?.value)
    )
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    const body = (await req.json().catch(() => ({}))) as { online?: unknown };
    await setOwnerOnline(body.online !== false);
    return NextResponse.json({ ok: true });
  });
}
