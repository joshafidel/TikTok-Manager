import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TikTok Manager",
  description: "Three channels, one calendar.",
};

const NAV = [
  { href: "/", label: "Today" },
  { href: "/calendar", label: "Calendar" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/clips", label: "Clips" },
  { href: "/channels", label: "Channels" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b-2 border-ink py-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="h-2 w-2 flex-none rounded-full bg-[var(--tally)]" />
              <span className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.13em]">
                TikTok Manager
              </span>
            </Link>
            <nav className="flex flex-wrap gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-sm px-2.5 py-1.5 font-mono text-[0.68rem] font-bold uppercase tracking-[0.08em] text-ink3 transition-colors hover:bg-surface2 hover:text-ink"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
