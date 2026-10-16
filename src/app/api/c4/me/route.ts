import { NextResponse, type NextRequest } from "next/server";
import { isOwner, liveGamesConfigured, OWNER_COOKIE } from "@/lib/c4-server";

export const dynamic = "force-dynamic";

/** Whether live games are available, and whether this browser is John's. */
export function GET(req: NextRequest) {
  return NextResponse.json({
    live: liveGamesConfigured(),
    owner:
      liveGamesConfigured() && isOwner(req.cookies.get(OWNER_COOKIE)?.value),
  });
}
