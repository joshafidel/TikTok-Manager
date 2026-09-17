"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, videos } from "@/db";
import type { Video } from "@/db/schema";
import { ready } from "@/db/ready";
import { fetchTranscription, startTranscription } from "./video/transcribe";
import { planEdit } from "./video/plan";
import { checkRender, submitRender } from "./video/render";

const now = () => new Date().toISOString();

export type VideoState = {
  id: string;
  status: Video["status"];
  label: string;
  url?: string | null;
  error?: string | null;
  /** True while the client should keep calling advanceVideo. */
  working: boolean;
  summary?: string;
};

/** Called by the browser once its direct-to-storage upload resolves. */
export async function registerUpload(input: {
  channelId: string;
  itemId?: string | null;
  filename: string;
  url: string;
  sizeBytes?: number;
}): Promise<string> {
  await ready();
  const id = randomUUID();
  await db.insert(videos).values({
    id,
    channelId: input.channelId,
    itemId: input.itemId ?? null,
    filename: input.filename,
    sourceUrl: input.url,
    sizeBytes: input.sizeBytes ?? null,
    status: "uploaded",
    createdAt: now(),
    updatedAt: now(),
  });
  revalidatePath("/", "layout");
  return id;
}

async function get(id: string): Promise<Video | undefined> {
  await ready();
  const [row] = await db.select().from(videos).where(eq(videos.id, id));
  return row;
}

async function patch(id: string, set: Partial<Video>) {
  await db
    .update(videos)
    .set({ ...set, updatedAt: now() })
    .where(eq(videos.id, id));
}

const LABEL: Record<Video["status"], string> = {
  uploaded: "Queued",
  transcribing: "Listening to your audio",
  planning: "Planning the cuts",
  rendering: "Rendering your edit",
  ready: "Done",
  failed: "Failed",
};

function state(v: Video): VideoState {
  return {
    id: v.id,
    status: v.status,
    label: LABEL[v.status],
    url: v.renderUrl,
    error: v.error,
    working: v.status !== "ready" && v.status !== "failed",
    summary: v.plan
      ? `Cut ${v.plan.cuts.length} dead spots — ${v.plan.sourceDuration.toFixed(1)}s down to ${v.plan.keptDuration.toFixed(1)}s`
      : undefined,
  };
}

/**
 * Moves one video one step along the pipeline and returns immediately. The
 * client calls this repeatedly, which keeps every request short — transcription
 * and rendering both take far longer than a serverless function may run.
 */
export async function advanceVideo(id: string): Promise<VideoState | null> {
  const video = await get(id);
  if (!video) return null;

  try {
    switch (video.status) {
      case "uploaded": {
        const transcriptId = await startTranscription(video.sourceUrl);
        await patch(id, { transcriptId, status: "transcribing" });
        break;
      }

      case "transcribing": {
        if (!video.transcriptId) throw new Error("Lost the transcription job.");
        const result = await fetchTranscription(video.transcriptId);
        if (result.status === "processing") break;

        if (!result.words.length) {
          throw new Error("No speech detected. The edit needs dialogue to cut against.");
        }

        const plan = planEdit(result.words, result.duration);
        await patch(id, {
          transcriptText: result.text,
          words: result.words,
          plan,
          status: "planning",
        });
        break;
      }

      case "planning": {
        if (!video.plan) throw new Error("No edit plan to render.");
        const renderId = await submitRender(video.sourceUrl, video.plan);
        await patch(id, { renderId, status: "rendering" });
        break;
      }

      case "rendering": {
        if (!video.renderId) throw new Error("Lost the render job.");
        const r = await checkRender(video.renderId);
        if (r.status === "failed") throw new Error(r.error ?? "The render failed.");
        if (r.status === "done" && r.url) {
          await patch(id, { renderUrl: r.url, status: "ready" });
          revalidatePath("/", "layout");
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    await patch(id, {
      status: "failed",
      error: err instanceof Error ? err.message : "Something went wrong.",
    });
  }

  const updated = await get(id);
  return updated ? state(updated) : null;
}

export async function retryVideo(id: string): Promise<VideoState | null> {
  const video = await get(id);
  if (!video) return null;

  // Resume from the furthest point that still has usable output.
  const resume: Video["status"] = video.plan ? "planning" : video.transcriptId ? "transcribing" : "uploaded";
  await patch(id, { status: resume, error: null, renderId: null });
  return advanceVideo(id);
}

export async function deleteVideo(id: string) {
  await ready();
  await db.delete(videos).where(eq(videos.id, id));
  revalidatePath("/", "layout");
}
