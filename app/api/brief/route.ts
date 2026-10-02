import { NextResponse } from "next/server";
import { runDailyBrief } from "@/lib/brief";

/**
 * The timer calls this once a day (schedule in vercel.json). When a
 * CRON_SECRET is set, only the timer's own calls get through; without one the
 * route is as open as the rest of the app, which has no password either.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const force = new URL(req.url).searchParams.get("force") === "1";
    const result = await runDailyBrief({ force });
    return NextResponse.json({
      date: result.date,
      created: result.created,
      scripted: result.scripted,
      stories: result.stories.map((s) => s.title),
      error: result.error,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "The scan failed." },
      { status: 500 },
    );
  }
}
