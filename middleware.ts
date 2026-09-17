import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * A deployed instance needs a hosted database; a local file cannot work on a
 * read-only filesystem. Catch that here rather than letting every page fail its
 * own way.
 *
 * A password is optional by choice — set APP_PASSWORD to turn the login on,
 * leave it unset and the site is open to anyone with the URL.
 */
function misconfigured(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const url = process.env.DATABASE_URL;
  return !url || url.startsWith("file:");
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (misconfigured()) {
    if (pathname === "/locked") return NextResponse.next();
    return NextResponse.redirect(new URL("/locked", req.url));
  }

  // No password set means no login at all — the site is open.
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();

  if (pathname === "/login") return NextResponse.next();

  if (await verifySessionToken(password, req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const url = new URL("/login", req.url);
  if (pathname !== "/") url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|api/blob).*)",
  ],
};
