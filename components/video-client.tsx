"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { advanceVideo, registerUpload, type VideoState } from "@/lib/video-actions";

/**
 * Upload a recording and auto-edit it.
 *
 * The file goes straight from the browser to blob storage — a video is far past
 * the request body limit, so it must never pass through a server function. The
 * edit then advances one step per call, which keeps each request short enough
 * to finish.
 */
export function VideoUploader({ channelId }: { channelId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [state, setState] = useState<VideoState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const drive = useCallback(
    async (videoId: string) => {
      // Poll until the pipeline reaches a terminal state.
      for (let guard = 0; guard < 200; guard++) {
        const next = await advanceVideo(videoId);
        if (!next) break;
        setState(next);
        if (!next.working) {
          router.refresh();
          break;
        }
        await new Promise((r) => setTimeout(r, 2500));
      }
    },
    [router],
  );

  const onPick = useCallback(
    async (file: File) => {
      setError(null);
      setState(null);
      setProgress(0);

      try {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
          onUploadProgress: (p) => setProgress(Math.round(p.percentage)),
        });
        setProgress(100);

        const videoId = await registerUpload({
          channelId,
          filename: file.name,
          url: blob.url,
          sizeBytes: file.size,
        });

        await drive(videoId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setProgress(null);
        if (input.current) input.current.value = "";
      }
    },
    [channelId, drive],
  );

  const busy = progress !== null || Boolean(state?.working);

  return (
    <div className="card p-4">
      <input
        ref={input}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onPick(file);
        }}
      />

      <button
        type="button"
        className="btn btn-primary"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        {busy ? "Working…" : "Upload a recording"}
      </button>

      <p className="mt-2 font-mono text-[0.62rem] leading-relaxed text-ink3">
        It cuts your dead air and filler words, burns in captions, and hands back a vertical MP4.
      </p>

      {progress !== null && progress < 100 && (
        <Bar label={`Uploading ${progress}%`} pct={progress} />
      )}

      {state && (
        <div className="mt-3 border-t border-rulesoft pt-3">
          <p className="label">{state.label}</p>
          {state.summary && <p className="mt-1 text-sm text-ink2">{state.summary}</p>}
          {state.working && <Bar label="" pct={null} />}
          {state.error && (
            <p className="mt-1 font-mono text-[0.68rem] leading-relaxed text-[var(--tally)]">
              {state.error}
            </p>
          )}
          {state.url && (
            <a
              href={state.url}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-primary mt-3"
            >
              Open your edited video
            </a>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 font-mono text-[0.68rem] leading-relaxed text-[var(--tally)]">{error}</p>
      )}
    </div>
  );
}

function Bar({ label, pct }: { label: string; pct: number | null }) {
  return (
    <div className="mt-2">
      {label && <p className="label mb-1">{label}</p>}
      <div className="h-1 w-full overflow-hidden rounded-full bg-surface2">
        <div
          className={`h-full rounded-full bg-[var(--tally)] ${pct === null ? "w-1/3 animate-pulse" : ""}`}
          style={pct === null ? undefined : { width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
