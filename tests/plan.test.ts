import { planEdit, keptSegments } from "@/lib/video/plan";
import { buildEdit } from "@/lib/video/edit-doc";
import type { Word } from "@/db/schema";

let pass = 0, fail = 0;
const check = (name: string, cond: boolean, extra = "") => {
  if (cond) { pass++; console.log("  PASS ", name); }
  else { fail++; console.log("  FAIL ", name, extra); }
};

const w = (text: string, start: number, end: number, filler = false): Word =>
  ({ text, start, end, filler });

// A take with: a false start, a filler word, and a long mid pause.
const words: Word[] = [
  w("So", 1.20, 1.45),
  w("um", 1.50, 1.80, true),
  w("here", 1.85, 2.10),
  w("is", 2.12, 2.28),
  w("the", 2.30, 2.44),
  w("thing", 2.46, 2.80),
  // 2.2s of dead air
  w("nobody", 5.00, 5.50),
  w("tells", 5.52, 5.80),
  w("you", 5.82, 6.00),
];
const SOURCE = 8.0;

const plan = planEdit(words, SOURCE);

check("cuts the lead-in silence", plan.cuts.some((c) => c.start === 0 && c.reason === "silence"));
check("cuts the filler word", plan.cuts.some((c) => c.reason === "filler"));
check("cuts the mid pause", plan.cuts.some((c) => c.reason === "silence" && c.start > 2.5 && c.end < 5.1));
check("cuts trailing silence", plan.cuts.some((c) => c.end >= SOURCE - 0.01));
check("output is shorter than source", plan.keptDuration < SOURCE, `${plan.keptDuration} vs ${SOURCE}`);

// Cuts must never overlap, or segments go negative.
const sorted = [...plan.cuts].sort((a, b) => a.start - b.start);
check("cuts do not overlap", sorted.every((c, i) => i === 0 || c.start >= sorted[i - 1].end - 1e-9));
check("no zero-length cuts", plan.cuts.every((c) => c.end > c.start));

const segs = keptSegments(plan.cuts, SOURCE);
check("segments are positive length", segs.every((s) => s.end > s.start));
check("segments are contiguous in output", segs.every((s, i) =>
  i === 0 ? Math.abs(s.outStart) < 1e-6
          : Math.abs(s.outStart - (segs[i-1].outStart + (segs[i-1].end - segs[i-1].start))) < 1e-6));
check("kept duration matches segments",
  Math.abs(segs.reduce((n, s) => n + (s.end - s.start), 0) - plan.keptDuration) < 1e-6);

// Captions must live in OUTPUT time, inside the new (shorter) duration.
check("captions exist", plan.captions.length > 0);
check("captions within output duration",
  plan.captions.every((c) => c.start >= -1e-6 && c.end <= plan.keptDuration + 1e-6),
  JSON.stringify(plan.captions));
check("captions are ordered and non-overlapping",
  plan.captions.every((c, i) => i === 0 || c.start >= plan.captions[i-1].end - 1e-6));
check("captions exclude filler", !plan.captions.some((c) => /\bum\b/i.test(c.text)));
check("caption text covers the real words",
  plan.captions.map((c) => c.text).join(" ").includes("nobody tells you"));

// The provider document must be structurally sane.
const edit = buildEdit("https://example.com/v.mp4", plan) as any;
check("edit has two tracks", edit.timeline.tracks.length === 2);
check("video clips equal segments", edit.timeline.tracks[1].clips.length === segs.length);
check("caption clips equal captions", edit.timeline.tracks[0].clips.length === plan.captions.length);
check("all clip lengths positive", [...edit.timeline.tracks[0].clips, ...edit.timeline.tracks[1].clips]
  .every((c: any) => c.length > 0));
check("output is vertical 1080x1920",
  edit.output.size.width === 1080 && edit.output.size.height === 1920);

// Degenerate inputs must not explode.
const empty = planEdit([], 5);
check("empty transcript is a no-op", empty.cuts.length === 0 && empty.keptDuration === 5);
const allFiller = planEdit([w("um", 0.1, 0.4, true)], 1);
check("all-filler clip still plans", Array.isArray(allFiller.cuts));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
