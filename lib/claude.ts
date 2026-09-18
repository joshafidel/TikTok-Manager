import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";
import type { Channel, Item } from "@/db/schema";
import { CRAFT_PLAYBOOK } from "./playbook";

const MODEL = "claude-opus-5";

/**
 * Server-side fallback: if a request is declined by a safety classifier the API
 * re-runs it on a fallback model inside the same call, so a single odd prompt
 * doesn't dead-end the writer's room.
 */
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

let cached: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new GenerationError(
      "No ANTHROPIC_API_KEY set. Add it to .env.local and restart the dev server.",
    );
  }
  cached ??= new Anthropic();
  return cached;
}

export class GenerationError extends Error {}

/* -------------------------------------------------------------------------- */
/* Channel voice                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The channel profile is the whole reason this app beats a chat window: every
 * request carries the mission, voice, format library and the explicit list of
 * moves this channel never makes.
 */
function channelSystem(channel: Channel): string {
  const formats = channel.formats
    .map(
      (f) =>
        `- [${f.key}] ${f.name}\n    What it is: ${f.description}\n    Shape: ${f.structure}`,
    )
    .join("\n");

  const never = channel.neverDo.map((n) => `- ${n}`).join("\n");

  return [
    `You are the writer's room for one TikTok channel. You know this channel better than anyone and you protect its voice.`,
    ``,
    `CHANNEL: ${channel.name}`,
    ``,
    `MISSION`,
    channel.mission,
    ``,
    `AUDIENCE`,
    channel.audience,
    ``,
    `VOICE`,
    channel.voice,
    ``,
    `FORMAT LIBRARY (every idea must fit one of these)`,
    formats,
    ``,
    `NEVER DO`,
    never,
    channel.productNotes
      ? `\nWHAT THE PRODUCT ACTUALLY IS\n${channel.productNotes}\n\nEvery claim must come from the above. Never invent a feature, a price, or a capability that is not written there — if something is missing, write around it rather than guessing.`
      : ``,
    channel.cta ? `\nSTANDING CALL TO ACTION\n${channel.cta}` : ``,
    ``,
    CRAFT_PLAYBOOK,
    ``,
    `HOW GOOD WORK IS JUDGED HERE`,
    `- The first line is the whole video. If someone scrolling past would not stop, the idea has failed regardless of how good the rest is.`,
    `- Specific beats clever. A real number, a named tool, an actual clip, a concrete moment — always better than a general observation.`,
    `- Write the way this host talks, not the way TikTok captions are written. No "let's dive in", no "here's the thing", no rhetorical question openers.`,
    `- One idea per video. If it needs two, it is two videos.`,
    `- Assume 25-55 seconds of screen time unless told otherwise.`,
  ].join("\n");
}

/* -------------------------------------------------------------------------- */
/* Ideas                                                                      */
/* -------------------------------------------------------------------------- */

const IdeasSchema = z.object({
  ideas: z.array(
    z.object({
      title: z.string().describe("Short working title, how you'd refer to it on a shot list"),
      formatKey: z.string().describe("Key of the format from the library this uses"),
      hook: z.string().describe("The literal first line of the video, word for word"),
      premise: z.string().describe("One sentence: what happens in this video"),
      whyItWorks: z.string().describe("One sentence of honest reasoning, including the risk"),
    }),
  ),
});

export type GeneratedIdea = z.infer<typeof IdeasSchema>["ideas"][number];

export async function generateIdeas(opts: {
  channel: Channel;
  count: number;
  /** Titles already in the pipeline, so the batch doesn't repeat them. */
  recentTitles: string[];
  /** Titles that actually performed, to steer the batch. */
  topPerformers?: string[];
  /** Free-text steer from the user: a theme, a news peg, a clip to build on. */
  steer?: string;
  /** Real, current material to build on. Without it the model invents plausible fiction. */
  newsDigest?: string;
}): Promise<GeneratedIdea[]> {
  const { channel, count, recentTitles, topPerformers = [], steer, newsDigest } = opts;

  const context = [
    `Generate ${count} video ideas for this channel.`,
    ``,
    `Generate variety across the format library rather than ${count} takes on one format.`,
    `Expect most of these to be rejected — that is the point. Do not hedge toward safe ideas to raise the hit rate; a batch of ${count} where three are excellent and the rest are discarded is the goal.`,
    recentTitles.length
      ? `\nALREADY IN THE PIPELINE — do not repeat or near-repeat these:\n${recentTitles.map((t) => `- ${t}`).join("\n")}`
      : ``,
    topPerformers.length
      ? `\nTHESE PERFORMED WELL — the batch should lean toward what made them work:\n${topPerformers.map((t) => `- ${t}`).join("\n")}`
      : ``,
    steer ? `\nSTEER FOR THIS BATCH\n${steer}` : ``,
    newsDigest
      ? [
          ``,
          `WHAT IS ACTUALLY HAPPENING RIGHT NOW`,
          `These were pulled from the web just now. Build the batch on these real items.`,
          ``,
          newsDigest,
          ``,
          `Every idea must point at something on this list, named exactly. Do not invent a study, a tool, a company, a number or an event. Do not write a hypothetical scenario — "imagine if", "let's say a company", "picture this" are all failures here. If an item on the list is too thin to carry a video, skip it rather than embellishing it.`,
        ].join("\n")
      : ``,
  ].join("\n");

  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: zodOutputFormat(IdeasSchema) },
    system: [
      { type: "text", text: channelSystem(channel), cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: context }],
  });

  assertNotRefused(response.stop_reason);
  const parsed = response.parsed_output;
  if (!parsed) throw new GenerationError("Claude returned no parseable ideas. Try again.");
  return parsed.ideas;
}

/* -------------------------------------------------------------------------- */
/* Scripts                                                                    */
/* -------------------------------------------------------------------------- */

const ScriptSchema = z.object({
  hook: z.string().describe("The literal first line, word for word. A pattern interrupt."),
  script: z
    .string()
    .describe(
      "The script or beat sheet as markdown, with pattern interrupts marked inline as [INTERRUPT: what changes]",
    ),
  estimatedSeconds: z
    .number()
    .describe("Honest runtime at a natural speaking pace. Shorter is better than padded."),
  loopLine: z
    .string()
    .describe("The closing line, written to send the viewer back to the opening frame"),
  shotNotes: z.string().describe("What to film or capture on screen, as markdown bullets"),
  caption: z.string().describe("The TikTok caption"),
  hashtags: z.array(z.string()).describe("Hashtags without the # prefix"),
});

export type GeneratedScript = z.infer<typeof ScriptSchema>;

export async function generateScript(opts: {
  channel: Channel;
  item: Item;
  /** Source clip for a reaction video, if this item has one. */
  clip?: { sourceUrl: string; premise: string | null } | null;
}): Promise<GeneratedScript> {
  const { channel, item, clip } = opts;
  const format = channel.formats.find((f) => f.key === item.formatKey);

  const styleBrief =
    channel.scriptStyle === "beats"
      ? [
          `Write a BEAT SHEET, not a script. This host improvises and reading kills the delivery.`,
          `Each beat is: a stage direction for what is happening on screen, then the reaction to hit — an intention and an energy level, not a line to memorise.`,
          `The only thing written word-for-word is the opening line and the closing button line.`,
          `Mark roughly where the source clip should be playing versus where the camera is on the host.`,
        ].join("\n")
      : [
          `Write a FULL SCRIPT, word for word, in this host's voice.`,
          `Mark visual cues inline in square brackets — [screen recording: ...], [diagram: ...], [cut to: ...].`,
          `Read it back to yourself for breath. Sentences that cannot be said in one breath get cut down.`,
        ].join("\n");

  const context = [
    `Write the video.`,
    ``,
    `TITLE: ${item.title}`,
    item.premise ? `PREMISE: ${item.premise}` : ``,
    item.hook ? `EXISTING HOOK (improve it if you can beat it): ${item.hook}` : ``,
    format ? `\nFORMAT: ${format.name}\nShape: ${format.structure}` : ``,
    clip
      ? `\nSOURCE CLIP: ${clip.sourceUrl}${clip.premise ? `\nWhat is in it: ${clip.premise}` : ``}\nYou have not watched this clip. Write beats that work off the described premise and leave room for the real reaction.`
      : ``,
    item.notes ? `\nNOTES FROM THE HOST: ${item.notes}` : ``,
    ``,
    styleBrief,
    ``,
    `Also write the caption and hashtags. The caption adds something the video does not say out loud — it does not summarise the video.`,
    ``,
    `Hold yourself to the playbook: the hook is a pattern interrupt, the middle carries 3-5 marked interrupts, and the close earns a rewatch. Cut the video where the idea ends rather than padding to a round number.`,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: zodOutputFormat(ScriptSchema) },
    system: [
      { type: "text", text: channelSystem(channel), cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: context }],
  });

  assertNotRefused(response.stop_reason);
  const parsed = response.parsed_output;
  if (!parsed) throw new GenerationError("Claude returned no parseable script. Try again.");
  return parsed;
}

function assertNotRefused(stopReason: string | null) {
  if (stopReason === "refusal") {
    throw new GenerationError(
      "Claude declined this request. Rework the premise or the notes and try again.",
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Captions for a recorded video                                              */
/* -------------------------------------------------------------------------- */

const CaptionSchema = z.object({
  caption: z.string().describe("The caption to post with this video"),
  captionAlt: z.string().describe("A second, differently-angled option"),
  hashtags: z
    .array(z.string())
    .describe("3-5 hashtags without the # prefix, mixing broad reach with niche relevance"),
  hashtagNote: z
    .string()
    .describe("One sentence on which tags are the broad ones and which are the niche ones, and why"),
});

export type GeneratedCaption = z.infer<typeof CaptionSchema>;

/**
 * Writes the caption from what was actually said on camera, rather than from
 * the script that was planned — takes drift, ad libs and all.
 */
export async function captionForVideo(opts: {
  channel: Channel;
  transcript: string;
}): Promise<GeneratedCaption> {
  const { channel, transcript } = opts;

  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: zodOutputFormat(CaptionSchema) },
    system: [
      { type: "text", text: channelSystem(channel), cache_control: { type: "ephemeral" } },
    ],
    messages: [
      {
        role: "user",
        content: [
          `Here is the transcript of a video that was just recorded for this channel.`,
          ``,
          `---`,
          transcript.slice(0, 12000),
          `---`,
          ``,
          `Write the caption from what was actually said, not from what might have been planned.`,
          `The caption should add something the video does not say out loud — a second angle, a question worth answering in the comments, or the detail that makes someone send it to a friend. It must not summarise the video.`,
          ``,
          `Then choose the hashtags by the playbook: 3-5 total, 1-2 broad and 2-3 genuinely niche, every one of them actually relevant to what was said. The goal is reaching the people most likely to watch this to the end and follow, not the largest possible number of impressions — irrelevant tags weaken the topic signal and cost reach.`,
        ].join("\n"),
      },
    ],
  });

  assertNotRefused(response.stop_reason);
  const parsed = response.parsed_output;
  if (!parsed) throw new GenerationError("Claude returned no parseable caption. Try again.");
  return parsed;
}
