import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Channel } from "@/db/schema";

const MODEL = "claude-opus-5";

let cached: Anthropic | null = null;
function client(): Anthropic {
  cached ??= new Anthropic();
  return cached;
}

/**
 * Pulls real, current, named material for a channel before ideas are written.
 *
 * Without this the model has nothing current to point at and invents plausible
 * hypotheticals — which is exactly what makes a news channel feel fake. Grounding
 * the batch in things that actually happened is the difference.
 */
export async function getNewsDigest(channel: Channel): Promise<string> {
  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    output_config: { effort: "low" },
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }],
    messages: [
      {
        role: "user",
        content: [
          `Search the web and list what is genuinely new and worth covering right now for this channel.`,
          ``,
          `CHANNEL: ${channel.name}`,
          `WHAT IT COVERS: ${channel.mission}`,
          `AUDIENCE: ${channel.audience}`,
          ``,
          `Find 8-12 items from the last two weeks. For each, give:`,
          `- the specific thing, named exactly (the model, the company, the tool, the paper, the feature)`,
          `- what actually happened or what it actually does, in one or two sentences`,
          `- the date, and the source`,
          `- why someone in this audience would care`,
          ``,
          `Rules:`,
          `- Real and verifiable only. Do not include anything you could not confirm by searching.`,
          `- Prefer concrete launches, releases, tools people can open today, and findings with numbers — over commentary and opinion pieces.`,
          `- Include a mix: major news, and at least three smaller tools or sites the audience probably has not seen.`,
          `- If something is rumoured rather than confirmed, label it as such.`,
          ``,
          `Output a plain list. No preamble.`,
        ].join("\n"),
      },
    ],
  });

  return response.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
