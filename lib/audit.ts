import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";
import type { Channel } from "@/db/schema";
import type { GeneratedIdea } from "./claude";

const MODEL = "claude-opus-5";

let cached: Anthropic | null = null;
function client(): Anthropic {
  cached ??= new Anthropic();
  return cached;
}

const VerdictSchema = z.object({
  verdicts: z.array(
    z.object({
      index: z.number().describe("Position of the idea in the list, starting at 0"),
      keep: z.boolean().describe("False if this idea breaks a rule and should be thrown away"),
      reason: z.string().describe("One short sentence. Only meaningful when keep is false."),
    }),
  ),
});

export type Rejection = { title: string; reason: string };

/**
 * Throws away ideas that break the channel's own rules before they ever reach
 * the list.
 *
 * Generation is good but not perfect, and a single invented anecdote or an
 * off-brief idea costs more than the tokens spent checking. The generator is
 * not asked to mark its own homework in the same call — a separate pass with
 * only the rules in front of it catches things the writing pass talks itself
 * into.
 */
export async function auditIdeas(
  channel: Channel,
  ideas: GeneratedIdea[],
): Promise<{ kept: GeneratedIdea[]; rejected: Rejection[] }> {
  if (!ideas.length) return { kept: [], rejected: [] };

  const listed = ideas
    .map(
      (idea, i) =>
        `[${i}] TITLE: ${idea.title}\n    HOOK: ${idea.hook}\n    PREMISE: ${idea.premise}`,
    )
    .join("\n\n");

  const rules = [
    `CHANNEL: ${channel.name}`,
    `WHAT IT IS FOR: ${channel.mission}`,
    ``,
    `THIS CHANNEL NEVER DOES:`,
    ...channel.neverDo.map((n) => `- ${n}`),
    ``,
    `ALLOWED FORMATS: ${channel.formats.map((f) => f.name).join(", ")}`,
  ].join("\n");

  try {
    const response = await client().messages.parse({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: "low", format: zodOutputFormat(VerdictSchema) },
      messages: [
        {
          role: "user",
          content: [
            `Judge each idea against this channel's rules and throw out the ones that break them.`,
            ``,
            rules,
            ``,
            `Throw an idea out when any of these is true:`,
            `- It rests on a made-up personal story, a conversation that did not happen, an invented statistic, a fabricated test result, or any specific claim presented as fact that nobody could verify. This is the most common failure and the most important to catch.`,
            `- It is hypothetical — "imagine if", "let's say", "picture this".`,
            `- It breaks one of the never-do rules above.`,
            `- It does not fit any allowed format.`,
            `- It is so vague it could be about anything.`,
            ``,
            `Keep everything else. Being merely ordinary is not grounds for throwing an idea out — only an actual rule break is.`,
            ``,
            `THE IDEAS:`,
            ``,
            listed,
          ].join("\n"),
        },
      ],
    });

    const verdicts = response.parsed_output?.verdicts ?? [];
    if (!verdicts.length) return { kept: ideas, rejected: [] };

    const kept: GeneratedIdea[] = [];
    const rejected: Rejection[] = [];

    ideas.forEach((idea, i) => {
      const verdict = verdicts.find((v) => v.index === i);
      // No verdict means no evidence against it, so it stays.
      if (!verdict || verdict.keep) kept.push(idea);
      else rejected.push({ title: idea.title, reason: verdict.reason });
    });

    return { kept, rejected };
  } catch {
    // A failed check must not block the batch — an unchecked idea beats none.
    return { kept: ideas, rejected: [] };
  }
}
