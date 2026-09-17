import type { Caption, Cut, EditPlan, Word } from "@/db/schema";

/** A pause longer than this reads as dead air rather than a beat. */
const SILENCE_THRESHOLD = 0.55;

/** Breath left around a cut so speech doesn't get clipped mid-consonant. */
const PAD = 0.06;

/** Captions read best in short bursts rather than full sentences. */
const MAX_CAPTION_WORDS = 4;
const MAX_CAPTION_SECONDS = 1.8;

/**
 * Turns a word-level transcript into an edit: what to remove, and what the
 * captions should say once the timeline has collapsed.
 */
export function planEdit(words: Word[], sourceDuration: number): EditPlan {
  if (!words.length) {
    return { sourceDuration, keptDuration: sourceDuration, cuts: [], captions: [] };
  }

  const cuts: Cut[] = [];

  // Dead air before the first word is almost always a false start.
  if (words[0].start > SILENCE_THRESHOLD) {
    cuts.push({ start: 0, end: Math.max(0, words[0].start - PAD), reason: "silence" });
  }

  for (let i = 0; i < words.length; i++) {
    const w = words[i];

    if (w.filler) {
      cuts.push({ start: w.start - PAD, end: w.end + PAD, reason: "filler" });
      continue;
    }

    const next = words[i + 1];
    if (next && next.start - w.end > SILENCE_THRESHOLD) {
      cuts.push({ start: w.end + PAD, end: next.start - PAD, reason: "silence" });
    }
  }

  // Trailing silence after the last word.
  const last = words[words.length - 1];
  if (sourceDuration - last.end > SILENCE_THRESHOLD) {
    cuts.push({ start: last.end + PAD, end: sourceDuration, reason: "silence" });
  }

  const merged = mergeCuts(cuts.filter((c) => c.end > c.start));
  const kept = keptSegments(merged, sourceDuration);
  const keptDuration = kept.reduce((n, s) => n + (s.end - s.start), 0);

  return {
    sourceDuration,
    keptDuration,
    cuts: merged,
    captions: buildCaptions(words, kept),
  };
}

/** Overlapping or touching cuts would produce zero-length clips downstream. */
function mergeCuts(cuts: Cut[]): Cut[] {
  const sorted = [...cuts].sort((a, b) => a.start - b.start);
  const out: Cut[] = [];

  for (const cut of sorted) {
    const prev = out[out.length - 1];
    if (prev && cut.start <= prev.end + 0.01) {
      prev.end = Math.max(prev.end, cut.end);
      if (cut.reason === "filler") prev.reason = "filler";
    } else {
      out.push({ ...cut });
    }
  }
  return out;
}

export type Segment = { start: number; end: number; outStart: number };

/** The inverse of the cut list: what survives, and where it lands in the output. */
export function keptSegments(cuts: Cut[], sourceDuration: number): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  let out = 0;

  for (const cut of cuts) {
    if (cut.start > cursor) {
      const seg = { start: cursor, end: Math.min(cut.start, sourceDuration), outStart: out };
      if (seg.end - seg.start > 0.08) {
        segments.push(seg);
        out += seg.end - seg.start;
      }
    }
    cursor = Math.max(cursor, cut.end);
  }

  if (cursor < sourceDuration) {
    segments.push({ start: cursor, end: sourceDuration, outStart: out });
  }
  return segments;
}

/** Maps a source timestamp onto the output timeline, or null if it was cut. */
function toOutput(t: number, segments: Segment[]): number | null {
  for (const s of segments) {
    if (t >= s.start && t <= s.end) return s.outStart + (t - s.start);
  }
  return null;
}

function buildCaptions(words: Word[], segments: Segment[]): Caption[] {
  const captions: Caption[] = [];
  let chunk: { text: string[]; start: number; end: number } | null = null;

  const flush = () => {
    if (chunk && chunk.end > chunk.start) {
      captions.push({ text: chunk.text.join(" "), start: chunk.start, end: chunk.end });
    }
    chunk = null;
  };

  for (const w of words) {
    if (w.filler) continue;

    const start = toOutput(w.start, segments);
    const end = toOutput(w.end, segments);
    if (start === null || end === null) continue;

    if (!chunk) {
      chunk = { text: [w.text], start, end };
      continue;
    }

    const wouldRun = end - chunk.start;
    // A gap means the previous chunk ended on a cut; start fresh so captions
    // never stretch across a splice.
    const gap = start - chunk.end > 0.12;

    if (chunk.text.length >= MAX_CAPTION_WORDS || wouldRun > MAX_CAPTION_SECONDS || gap) {
      flush();
      chunk = { text: [w.text], start, end };
    } else {
      chunk.text.push(w.text);
      chunk.end = end;
    }
  }

  flush();
  return captions;
}
