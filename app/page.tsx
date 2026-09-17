import Image from "next/image";
import Link from "next/link";
import { getChannels } from "@/lib/queries";
import { getPool, POOL_SIZE } from "@/lib/pool";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const channels = await getChannels();
  const pools = await Promise.all(channels.map((c) => getPool(c.id)));

  return (
    <div>
      <div className="mb-8">
        <p className="label">Accounts</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Pick a channel</h1>
        <p className="mt-2 max-w-md text-sm text-ink2">
          Each one works the same way: ten ideas with scripts, ready to record.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {channels.map((channel, i) => {
          const ready = pools[i].filter((p) => p.script).length;
          return (
            <Link
              key={channel.id}
              href={`/a/${channel.id}`}
              className="card flex flex-col items-center p-6 text-center transition-colors hover:bg-surface2"
              style={{ borderTop: `3px solid ${channel.accent}` }}
            >
              {channel.logo ? (
                <Image
                  src={channel.logo}
                  alt=""
                  width={112}
                  height={112}
                  className="h-28 w-28 rounded-full"
                  priority
                />
              ) : (
                <span
                  className="flex h-28 w-28 items-center justify-center rounded-full font-mono text-2xl font-bold text-white"
                  style={{ backgroundColor: channel.accent }}
                >
                  {channel.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="mt-4 text-base font-semibold">{channel.name}</span>
              <span className="label mt-2">
                {ready} / {POOL_SIZE} scripts ready
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
