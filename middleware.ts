import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * A deployed instance needs a password and a hosted database. Missing either
 * one is a misconfiguration, not a runtime error, so catch it here rather than
 * letting every page fail its own way.
 */
function misconfigured(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const url = process.env.DATABASE_URL;
  return !process.env.APP_PASSWORD || !url || url.startsWith("file:");
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (misconfigured()) {
    if (pathname === "/locked") return NextResponse.next();
    return NextResponse.redirect(new URL("/locked", req.url));
  }

  const password = process.env.APP_PASSWORD;
  // Locally, with no password set, the app runs open — a login screen would
  // just be in the way on your own laptop.
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
