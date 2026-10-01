import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";
import type { Channel } from "@/db/schema";

const MODEL = "claude-opus-5";

let cached: Anthropic | null = null;
function client(): Anthropic {
  cached ??= new Anthropic();
  return cached;
}

const SourcesSchema = z.object({
  sources: z.array(
    z.object({
      handle: z.string().describe("The account handle including the @"),
      url: z.string().describe("Link to the account"),
      posts: z.string().describe("What this account actually posts, in one sentence"),
      whyItFits: z.string().describe("Why it suits this channel, and what to react to"),
      foundAt: z.string().describe("The page this account was found on, so it can be checked"),
    }),
  ),
});

export type FoundSource = z.infer<typeof SourcesSchema>["sources"][number];

/**
 * Finds real accounts to pull material from.
 *
 * Handles are only ever taken from live search results. An invented handle
 * would be worse than none — it sends the user to a dead page and quietly
 * teaches them not to trust the list, so the search step is not optional.
 */
export async function findSources(opts: {
  channel: Channel;
  count: number;
  /** Handles already in the list, so the search does not return them again. */
  existing: string[];
}): Promise<FoundSource[]> {
  const { channel, count, existing } = opts;

  const research = await client().messages.create({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 14 }],
    messages: [
      {
        role: "user",
        content: [
          `Search the web for real Instagram accounts that would suit this channel as source material.`,
          ``,
          `CHANNEL: ${channel.name}`,
          `WHAT IT DOES: ${channel.mission}`,
          ``,
          `Look for the shock creators: OnlyFans models whose promotion strategy is doing something indefensible in public and announcing it, the record attempts and stunt announcements, the creator houses and collectives, the earnings brags, and the people whose podcast appearances produce genuinely deranged quotes said with total confidence.`,
          ``,
          `Do not return food accounts. No cursed cooking, no mukbang, no kitchen pages, no renovation or DIY, and no aggregator accounts that only repost other people's clips. That category was tried and removed from this channel — returning one wastes the slot.`,
          ``,
          `Search in several directions — news coverage of OnlyFans creators' publicity stunts, reporting on creator houses and who is in them, articles about creators banned or removed from platforms and where they went, roundups of the highest-earning creators, and interviews that produced a quotable line.`,
          ``,
          `Hard rules:`,
          `- Only report a handle you have actually seen in a search result. Never guess a handle, never assemble a plausible-looking one, never include an account you merely think probably exists.`,
          `- For every account, give the page you found it on so it can be checked.`,
          `- Skip anything centred on real violence or fights — that category is unusable here.`,
          `- Skip explicit pornography. The account has to be an Instagram page that can be shown on screen — provocative, crude and outrageous is the point, explicit is unusable.`,
          `- Skip any account that has been removed or banned, and say so rather than listing a dead profile.`,
          existing.length ? `- Already have these, do not repeat them: ${existing.join(", ")}` : ``,
          ``,
          `Report what you actually found. If you only confirm four accounts, report four — a short honest list beats a padded one.`,
        ].join("\n"),
      },
    ],
  });

  const findings = research.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (!findings) return [];

  const structured = await client().messages.parse({
    model: MODEL,
    max_tokens: 8000,
    output_config: { effort: "low", format: zodOutputFormat(SourcesSchema) },
    messages: [
      {
        role: "user",
        content: [
          `Here are search findings about Instagram accounts. Turn them into a clean list of up to ${count}.`,
          ``,
          findings,
          ``,
          `Include only accounts that actually appear above, with the handle exactly as written there. Do not add accounts, do not correct a handle into one you think is more likely, and do not invent the page it was found on. If fewer than ${count} are present, return fewer.`,
        ].join("\n"),
      },
    ],
  });

  return structured.parsed_output?.sources.slice(0, count) ?? [];
}
