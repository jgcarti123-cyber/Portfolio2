import { NextResponse, type NextRequest } from "next/server";
import {
  guarded,
  liveGamesConfigured,
  OWNER_COOKIE,
  ownerCookieValue,
  verifyOwnerLink,
} from "@/lib/c4-server";

/** A signed link (made by scripts/owner-link.mjs) that marks this browser as John's. */
export async function GET(req: NextRequest) {
  return guarded("owner", async () => {
    const e = req.nextUrl.searchParams.get("e") ?? "";
    const s = req.nextUrl.searchParams.get("s") ?? "";
    if (!liveGamesConfigured() || !verifyOwnerLink(e, s))
      return new NextResponse("This link has expired or isn't valid.", {
        status: 403,
      });

    const res = NextResponse.redirect(new URL("/", req.nextUrl.origin));
    const cookie = ownerCookieValue();
    res.cookies.set(OWNER_COOKIE, cookie.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: cookie.maxAge,
    });
    return res;
  });
}
