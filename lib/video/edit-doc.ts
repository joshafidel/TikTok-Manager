import type { EditPlan } from "@/db/schema";
import { keptSegments } from "./plan";

/**
 * Builds the provider's edit document from an EditPlan. Pure and free of any
 * network or server-only imports, so it can be unit tested directly — this is
 * where the timeline maths would go wrong silently.
 */
const WIDTH = 1080;
const HEIGHT = 1920;

/** Captions styled the way short-form captions actually read: big, centred, heavy stroke. */
function captionHtml(text: string): string {
  const safe = text.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  );
  return `<p data-html-type="text">${safe}</p>`;
}

const CAPTION_CSS = `
p {
  color: #ffffff;
  font-family: "Montserrat ExtraBold";
  font-size: 62px;
  line-height: 76px;
  text-align: center;
  text-transform: uppercase;
  -webkit-text-stroke: 8px #000000;
  paint-order: stroke fill;
}`.trim();

type Clip = Record<string, unknown>;

/** Builds the provider's edit document from our plan. */
export function buildEdit(sourceUrl: string, plan: EditPlan) {
  const segments = keptSegments(plan.cuts, plan.sourceDuration);

  const videoClips: Clip[] = segments.map((s) => ({
    asset: { type: "video", src: sourceUrl, trim: round(s.start), volume: 1 },
    start: round(s.outStart),
    length: round(s.end - s.start),
    fit: "cover",
  }));

  const captionClips: Clip[] = plan.captions.map((c) => ({
    asset: {
      type: "html",
      html: captionHtml(c.text),
      css: CAPTION_CSS,
      width: 900,
      height: 320,
    },
    start: round(c.start),
    length: round(Math.max(0.3, c.end - c.start)),
    position: "bottom",
    offset: { y: 0.18 },
  }));

  return {
    timeline: {
      background: "#000000",
      // Later tracks render underneath, so captions must come first.
      tracks: [{ clips: captionClips }, { clips: videoClips }],
    },
    output: {
      format: "mp4",
      size: { width: WIDTH, height: HEIGHT },
      fps: 30,
    },
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
