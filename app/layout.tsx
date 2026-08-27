import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { signOut } from "@/lib/actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "TikTok Manager",
  description: "Three channels, one calendar.",
  appleWebApp: { capable: true, title: "Manager", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eaedf1" },
    { media: "(prefers-color-scheme: dark)", color: "#101318" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const NAV = [
  { href: "/", label: "Today" },
  { href: "/calendar", label: "Calendar" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/clips", label: "Clips" },
  { href: "/channels", label: "Channels" },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const password = process.env.APP_PASSWORD;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  // Without a password the app is running unlocked on a laptop, so treat it as signed in.
  const signedIn = !password || (await verifySessionToken(password, token));

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
        />
      </head>
      <body>
        <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b-2 border-ink py-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="h-2 w-2 flex-none rounded-full bg-[var(--tally)]" />
              <span className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.13em]">
                TikTok Manager
              </span>
            </Link>
            {signedIn && (
              <nav className="flex flex-wrap items-center gap-1">
                {NAV.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="rounded-sm px-2.5 py-1.5 font-mono text-[0.68rem] font-bold uppercase tracking-[0.08em] text-ink3 transition-colors hover:bg-surface2 hover:text-ink"
                  >
                    {n.label}
                  </Link>
                ))}
                {password && (
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="rounded-sm px-2.5 py-1.5 font-mono text-[0.68rem] font-bold uppercase tracking-[0.08em] text-ink3 transition-colors hover:bg-surface2 hover:text-ink"
                    >
                      Sign out
                    </button>
                  </form>
                )}
              </nav>
            )}
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
