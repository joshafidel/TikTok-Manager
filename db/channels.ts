import type { Format } from "./schema";

/**
 * The three channel profiles the app ships with. Used both by `npm run db:seed`
 * and by the app's own first-run setup, so a fresh deployment comes up with
 * these already in place.
 */
const aiFormats: Format[] = [
  {
    key: "what-happened",
    name: "What just happened",
    description:
      "One specific, named thing that actually happened in AI in the last week or two.",
    structure:
      "Name it in the first line — the model, company or feature, exactly → what actually changed → the detail the coverage skipped → what it means for the viewer specifically → the sentence they can repeat to someone at work.",
  },
  {
    key: "open-this",
    name: "Open this today",
    description:
      "A real site or app the viewer can use in the next five minutes. Screen recording, not description.",
    structure:
      "Say the name and what it does in one line → show it working on screen → the one thing it does better than the obvious alternative → what it costs → who should not bother.",
  },
  {
    key: "headline-decode",
    name: "What that headline actually means",
    description:
      "A real story people are misreading this week, given the accurate version.",
    structure:
      "Quote the headline everyone saw → what the source actually says → the number or caveat that got dropped → whether it changes anything → the corrected one-liner.",
  },
  {
    key: "use-it-for",
    name: "Use it for this",
    description:
      "A practical job done with a named tool, start to finish, on screen.",
    structure:
      "The job, stated plainly → the tool being used → the actual steps on screen → the result, unedited → where it falls down.",
  },
  {
    key: "before-monday",
    name: "What you need to know",
    description:
      "A tight roundup of the three things that actually mattered this week.",
    structure:
      "Three, counted out → each one named, with what changed → which of the three actually affects the viewer → close on the one to watch next week.",
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
    key: "wish-there-was",
    name: "Don't you wish there was a way to…",
    description:
      "Name a frustration the viewer has genuinely had, sit in it, then reveal that the fix exists and show it working.",
    structure:
      "Open on the frustration itself, stated as something that happened to them this week — not a hypothetical → let it land, one beat of 'and there's no way to actually settle it' → 'there is' → show Tally doing exactly that thing on screen, in under ten seconds → the result appears → the ask.",
  },
  {
    key: "watch-me-do-it",
    name: "Watch me run one",
    description:
      "A real poll, created and sent and answered, start to finish on screen. The demo is the video.",
    structure:
      "The question you're about to ask, and why it's contested → create it on screen, fast → send it → results coming in → what surprised you → 'you can run one in about twenty seconds'.",
  },
  {
    key: "settle-it",
    name: "Let's settle it",
    description:
      "An argument people in your area are actually having, ended with real numbers.",
    structure:
      "State both sides fairly, fast → 'everyone's guessing' → run it → the actual split → who was wrong, including you if you were → the ask.",
  },
  {
    key: "how-you-do-it-now",
    name: "How you're doing this now",
    description:
      "The painful current workaround — the group chat, the Facebook thread, the loudest person winning — against the thirty-second version.",
    structure:
      "Show the mess: 200 unread messages, a comment section, nobody counting → 'this is how we decide things' → cut to Tally → same question, answered, counted → hold on the result.",
  },
  {
    key: "the-result",
    name: "The number that surprised me",
    description:
      "Lead with a genuinely counterintuitive result from a real poll, reveal the tool second.",
    structure:
      "The number, cold, no setup → what everyone assumes instead → the breakdown → where the number came from → run your own.",
  },
];

export const SUPERSEDED_MISSIONS = new Set<string>([
  "Establish real credibility on AI by being consistently more precise than everyone else in the feed. This channel is the top of the funnel for Tally — a viewer who trusts the explanations is a viewer who will try the app.",
  "Drive installs of Tally, a civic polling app. Judged on installs and poll creations, not views. A 4k-view video that converts beats a 90k-view video that does not.",
]);

export const CHANNEL_SEED = [
  {
    id: "ai",
    logo: "/logos/ai-with-receipts.png",
    name: "AI, with receipts",
    handle: null,
    accent: "#2A62A8",
    mission:
      "Keep people current on AI. Real news, real tools, real applications — what actually happened, what it means, and what is worth opening today. Credibility comes from being accurate and specific about things that genuinely exist, faster than the people around them. This is the channel brands in the AI space pay to be next to, and the top of the funnel for Tally.",
    audience:
      "Curious non-experts and early-career technical people who want to stay current without reading twenty newsletters. They feel behind, they are tired of hype and doom, and they can tell immediately when someone is describing something they have not actually used.",
    voice:
      "Precise, calm, a little dry. Explains rather than performs. Confident enough to say 'this part is genuinely unsettled'. Never breathless, never a doomer, never a booster.",
    formats: aiFormats,
    neverDo: [
      "Inventing anything. No made-up tools, companies, studies, numbers, benchmarks or events. If there is no real, current, named thing to point at, there is no video.",
      "Hypothetical framing of any kind — 'imagine if', 'let's say a company', 'picture this', 'suppose you had'. This channel covers what happened, not what could.",
      "Talking about a tool in the abstract instead of showing it on screen. If you cannot demo it, you have not used it enough to cover it.",
      "Mentioning the master's degree — it is in the bio, and saying it out loud reads as insecurity. Demonstrate instead.",
      "Hype framing: 'this changes everything', 'nobody is talking about this', 'AI just did something insane'.",
      "Predicting AGI timelines or job apocalypses.",
      "Covering a paper you have not read past the abstract, or a story you have only seen summarised.",
    ],
    cta: null,
    scriptStyle: "full" as const,
    cadencePerWeek: 4,
    targetDepth: 6,
    recordDays: [0, 3],
    sortOrder: 1,
    newsDriven: true,
  },
  {
    id: "reactions",
    logo: "/logos/reactions.png",
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
    logo: "/logos/tally.png",
    name: "Tally",
    handle: null,
    accent: "#1F7A5C",
    mission:
      "Market Tally. Every video introduces the app to someone who has never heard of it and shows them why it is worth opening — by naming a frustration they have actually had and then showing the app solving it on screen. Judged on installs and polls created, not views: a 4k-view video that converts beats a 90k-view video that does not.",
    audience:
      "People who argue about local issues in group chats and comment sections and are quietly frustrated that it never resolves anything — nobody counts, the loudest person wins. Most of them have never heard of Tally and are not looking for an app.",
    voice:
      "Grounded, curious, allergic to punditry and to advertising voice. Sounds like someone showing a friend something useful, not like a brand. Interested in what people actually think rather than in being right. Warm, never preachy. Treats disagreement as data.",
    formats: tallyFormats,
    neverDo: [
      "Opening with the product. Never 'introducing Tally', never 'check out my new app'. The frustration comes first and the app arrives as the answer to it — that order is the whole format.",
      "Inventing a problem the viewer has not had. A frustration they do not recognise makes the reveal feel like an infomercial, which is the failure mode of this format.",
      "Describing the app instead of showing it. Every video has the product on screen doing the actual thing, in seconds.",
      "Faking a poll or its results. Real questions, real numbers, however unflattering.",
      "Feature-listing. Nobody installs an app because it has features; they install it because they just watched it settle something.",
      "Partisan cheerleading — it halves the addressable audience and undercuts the premise that you want real numbers.",
      "Manufactured outrage as a hook.",
    ],
    cta: "Run the poll yourself — link in bio.",
    productNotes:
      "Tally is a civic polling app. You write a question, send it out, and get a counted answer back instead of an argument.\n\nFILL THIS IN — every marketing script is only as concrete as what is written here. Replace this with the real details:\n- What exactly can someone do in the first 30 seconds of opening it?\n- Who answers a poll — anyone, people nearby, a group you invite?\n- What does the result actually look like on screen?\n- What does it do that a group chat poll or a Twitter poll does not?\n- What does it cost?\n- What is the single most impressive thing to show someone who has never seen it?",
    scriptStyle: "full" as const,
    cadencePerWeek: 3,
    targetDepth: 4,
    recordDays: [0, 3],
    sortOrder: 3,
  },
];
