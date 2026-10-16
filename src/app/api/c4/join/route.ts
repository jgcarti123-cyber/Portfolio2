import { NextResponse, type NextRequest } from "next/server";
import { db, isExpired, liveGamesConfigured, OWNER_COOKIE, ownerCookieValue, verifyJoin } from "@/lib/c4-server";

/** John's Join link: proves it's him, marks this browser as his, and starts the game. */
export async function GET(req: NextRequest) {
  const g = req.nextUrl.searchParams.get("g") ?? "";
  const e = req.nextUrl.searchParams.get("e") ?? "";
  const s = req.nextUrl.searchParams.get("s") ?? "";
  if (!liveGamesConfigured() || !verifyJoin(g, e, s)) {
    return new NextResponse("This link has expired or isn't valid.", { status: 403 });
  }

  const supabase = db();
  const { data: game } = await supabase.from("c4_games").select("status, created_at").eq("id", g).single();
  if (game?.status === "waiting") {
    await supabase
      .from("c4_games")
      .update(isExpired(game) ? { status: "expired" } : { status: "live", updated_at: new Date().toISOString() })
      .eq("id", g)
      .eq("status", "waiting");
  }

  const res = NextResponse.redirect(new URL(`/?play=${g}`, req.nextUrl.origin));
  const cookie = ownerCookieValue();
  res.cookies.set(OWNER_COOKIE, cookie.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: cookie.maxAge,
  });
  return res;
}
