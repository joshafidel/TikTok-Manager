import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  const { pathname, search } = req.nextUrl;

  // No password configured. Fine on a laptop; never in production — a deployed
  // instance with no gate exposes the content and the API key to anyone.
  if (!password) {
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    if (pathname === "/locked") return NextResponse.next();
    return NextResponse.redirect(new URL("/locked", req.url));
  }

  if (pathname === "/login") return NextResponse.next();

  if (await verifySessionToken(password, req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const url = new URL("/login", req.url);
  if (pathname !== "/") url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except Next internals, the icon routes and the manifest.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest).*)"],
};
