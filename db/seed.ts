import { randomUUID } from "node:crypto";
import { db, channels, type Format } from "./index";

const aiFormats: Format[] = [
  {
    key: "headline-decode",
    name: "What that headline actually means",
    description:
      "Take an AI story people are misreading this week and give the real version.",
    structure:
      "Name the headline everyone saw → say plainly what it actually claims → the one detail the coverage dropped → what it means for the viewer → the sentence they can repeat to someone else.",
  },
  {
    key: "i-ran-it",
    name: "I ran it myself",
    description:
      "Hands-on test of a tool, model, or claim, with the screen recording as proof.",
    structure:
      "State the claim → show the setup in one shot → show the result unedited → where it broke → the honest verdict in one line.",
  },
  {
    key: "paper-nobody-read",
    name: "The paper nobody read",
    description:
      "One real finding from a paper, explained without jargon, with a diagram.",
    structure:
      "The surprising finding first → why the obvious intuition is wrong → the mechanism in one diagram → the caveat → why it changes what you'd do.",
  },
  {
    key: "quiet-failure",
    name: "What your AI tool is quietly doing wrong",
    description:
      "A specific, demonstrable failure mode in a tool the audience already uses.",
    structure:
      "Show the failure happening on screen → explain why it happens → show the fix → the general rule behind it.",
  },
  {
    key: "term-in-60",
    name: "The term, properly",
    description:
      "A term people use wrong (RAG, agent, fine-tune, reasoning) defined precisely.",
    structure:
      "The wrong definition people repeat → the actual definition → a concrete example → the test for telling them apart.",
  },
];

const reactionFormats: Format[] = [
  {
    key: "slow-realization",
    name: "The slow realization",
    description:
      "Start neutral, let the clip reveal itself, escalate as the horror lands.",
    structure:
      "Calm setup line → play into it → first flinch → the detail that makes it worse → full break → one-line button.",
  },
  {
    key: "who-approved",
    name: "Who signed off on this",
    description:
      "Treat the clip as a product that went through meetings and approvals.",
    structure:
      "Frame it as a workplace decision → walk through the imaginary approval chain → the moment someone should have stopped it → button.",
  },
  {
    key: "play-by-play",
    name: "Play-by-play",
    description: "Sports-commentary energy over a clip that escalates.",
    structure:
      "Commentator intro → call the action beat by beat → the turn → stunned silence → button.",
  },
  {
    key: "ranking",
    name: "Ranking the crimes",
    description: "Multiple clips, ranked, so the payoff builds.",
    structure:
      "Announce the bracket → clip 3 with a quick reaction → clip 2, worse → clip 1, the one that breaks you → verdict.",
  },
  {
    key: "explain-to-me",
    name: "Explain this to me",
    description:
      "Direct address to the creator of the original clip, asking sincere questions.",
    structure:
      "Genuine opening question → play a beat → follow-up question that gets more unhinged → the question nobody can answer → button.",
  },
];

const tallyFormats: Format[] = [
  {
    key: "i-polled",
    name: "I polled my [place] about [thing]",
    description:
      "Run a real poll in Tally, show the result. The demo and the video are the same thing.",
    structure:
      "The question and why it's contested → show the poll going out → the result on screen → the surprise in the data → what you're asking next (CTA).",
  },
  {
    key: "build-in-public",
    name: "Build in public",
    description: "One real decision or problem from this week of building Tally.",
    structure:
      "The problem in one line → why the obvious fix was wrong → what you shipped → what you learned → what's next.",
  },
  {
    key: "civic-take",
    name: "The take, then the poll",
    description:
      "A civic argument that ends by handing the question to the audience.",
    structure:
      "The claim → the strongest counter → why you still land where you land → 'I want the actual numbers' → poll CTA.",
  },
  {
    key: "data-surprise",
    name: "The number that surprised me",
    description: "Lead with a genuinely counterintuitive polling result.",
    structure:
      "The number cold → what everyone assumes → the actual breakdown → the likely reason → run your own (CTA).",
  },
];

const rows = [
  {
    id: "ai",
    name: "AI, with receipts",
    handle: null,
    accent: "#2A62A8",
    mission:
      "Establish real credibility on AI by being consistently more precise than everyone else in the feed. This channel is the top of the funnel for Tally — a viewer who trusts the explanations is a viewer who will try the app.",
    audience:
      "Curious non-experts and early-career technical people who follow AI news, feel behind, and are tired of both hype and doom. They can tell when someone actually understands the material.",
    voice:
      "Precise, calm, a little dry. Explains rather than performs. Confident enough to say 'this part is genuinely unsettled'. Never breathless, never a doomer, never a booster.",
    formats: aiFormats,
    neverDo: [
      "Mentioning the master's degree — it is in the bio, and saying it out loud reads as insecurity. Demonstrate instead.",
      "Hype framing: 'this changes everything', 'nobody is talking about this', 'AI just did something insane'.",
      "Predicting AGI timelines or job apocalypses.",
      "Explaining a paper you have not read past the abstract.",
      "Vague claims with no example, number, or screen recording behind them.",
    ],
    cta: null,
    scriptStyle: "full" as const,
    cadencePerWeek: 4,
    targetDepth: 6,
    recordDays: [0, 3],
    sortOrder: 1,
  },
  {
    id: "reactions",
    name: "Reactions",
    handle: null,
    accent: "#71469E",
    mission:
      "Volume and reach. Dramatic, funny reactions to absurdly gross Instagram reels. This is the channel that grows fastest and costs the least to make.",
    audience:
      "People who watch reaction content late at night and want a host whose reaction is bigger and funnier than their own. They are here for the delivery, not the clip.",
    voice:
      "Dramatic, expressive, quick. Comic timing over word count. Escalates hard but lands on a clean button line. Never mean about people's bodies, appearance, or poverty — the target is always the food, the choice, or the decision, never the person.",
    formats: reactionFormats,
    neverDo: [
      "Punching down — no jokes about anyone's body, weight, appearance, income, or disability.",
      "Reposting the source clip without meaningful transformation. Your face is on screen, you are talking across the whole clip, the framing is cropped.",
      "Showing genuinely graphic material uncut — blur it, cut away, or react to the reaction. TikTok suppresses reach on shocking content.",
      "Long setups. If the first line is not a reaction, cut it.",
      "Explaining the joke after the button line.",
    ],
    cta: null,
    scriptStyle: "beats" as const,
    cadencePerWeek: 6,
    targetDepth: 8,
    recordDays: [2],
    sortOrder: 2,
  },
  {
    id: "tally",
    name: "Tally",
    handle: null,
    accent: "#1F7A5C",
    mission:
      "Drive installs of Tally, a civic polling app. Judged on installs and poll creations, not views. A 4k-view video that converts beats a 90k-view video that does not.",
    audience:
      "Civically engaged people who argue about local issues online and are frustrated that nobody has real numbers. Skews toward people who already follow local politics.",
    voice:
      "Grounded, curious, allergic to punditry. Interested in what people actually think rather than in being right. Warm, not preachy. Treats disagreement as data.",
    formats: tallyFormats,
    neverDo: [
      "Partisan cheerleading — it halves the addressable audience and undercuts the premise that you want real numbers.",
      "Feature-listing the app instead of showing it doing something interesting.",
      "A CTA with no result attached. Always show the data first, then the ask.",
      "Manufactured outrage as a hook.",
      "Posting on a schedule with nothing to say. This calendar follows the roadmap.",
    ],
    cta: "Run the poll yourself — link in bio.",
    scriptStyle: "full" as const,
    cadencePerWeek: 3,
    targetDepth: 4,
    recordDays: [0, 3],
    sortOrder: 3,
  },
];

for (const row of rows) {
  await db
    .insert(channels)
    .values(row)
    .onConflictDoUpdate({ target: channels.id, set: row });
}

console.log(`Seeded ${rows.length} channels: ${rows.map((r) => r.id).join(", ")}`);
void randomUUID;
process.exit(0);
