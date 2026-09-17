import "server-only";
import type { Word } from "@/db/schema";

const API = "https://api.assemblyai.com/v2";

/**
 * Filler words worth cutting. Deliberately conservative — "like", "so" and
 * "you know" are excluded because they are usually load-bearing in speech and
 * cutting them makes delivery sound clipped.
 */
const FILLER = new Set(["um", "umm", "uh", "uhh", "uhm", "erm", "er", "ah", "hmm", "mm", "mhm"]);

function key(): string {
  const k = process.env.ASSEMBLYAI_API_KEY;
  if (!k) throw new Error("ASSEMBLYAI_API_KEY is not set — transcription is unavailable.");
  return k;
}

type AssemblyWord = { text: string; start: number; end: number };

export type TranscriptResult =
  | { status: "processing" }
  | { status: "completed"; text: string; words: Word[]; duration: number };

/**
 * Kicks off transcription and returns the job id. Submitting and polling are
 * separate so no single serverless request has to wait out a long transcript.
 * AssemblyAI pulls the media itself, so the file never passes back through here.
 */
export async function startTranscription(sourceUrl: string): Promise<string> {
  const res = await fetch(`${API}/transcript`, {
    method: "POST",
    headers: { authorization: key(), "content-type": "application/json" },
    body: JSON.stringify({
      audio_url: sourceUrl,
      // Filler words are excluded by default; we need them in order to cut them.
      disfluencies: true,
      punctuate: true,
      format_text: true,
    }),
  });

  if (!res.ok) {
    throw new Error(`Transcription request rejected (${res.status}): ${await res.text()}`);
  }

  const { id } = (await res.json()) as { id: string };
  if (!id) throw new Error("Transcription accepted but returned no job id.");
  return id;
}

/** One non-blocking check. Callers re-poll rather than holding a request open. */
export async function fetchTranscription(id: string): Promise<TranscriptResult> {
  const res = await fetch(`${API}/transcript/${id}`, { headers: { authorization: key() } });
  if (!res.ok) throw new Error(`Transcription poll failed (${res.status}).`);

  const data = (await res.json()) as {
    status: string;
    text?: string;
    words?: AssemblyWord[];
    audio_duration?: number;
    error?: string;
  };

  if (data.status === "error") throw new Error(data.error ?? "Transcription failed.");
  if (data.status !== "completed") return { status: "processing" };

  const words: Word[] = (data.words ?? []).map((w) => ({
    text: w.text,
    // AssemblyAI reports milliseconds; everything downstream works in seconds.
    start: w.start / 1000,
    end: w.end / 1000,
    filler: FILLER.has(w.text.toLowerCase().replace(/[^a-z]/g, "")),
  }));

  // Fall back to the last word's end if the service omits a duration.
  const duration = data.audio_duration ?? (words.length ? words[words.length - 1].end : 0);
  return { status: "completed", text: data.text ?? "", words, duration };
}
