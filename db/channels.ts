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

const streetFormats: Format[] = [
  {
    key: "confident-correction",
    name: "The confident correction",
    description:
      "They answer correctly. You tell them, completely calmly, that they are wrong — and give a wrong answer with total certainty.",
    structure:
      "Ask the question → they get it right → half a beat of nothing → 'ooh, so close' → deliver the false answer flatly, like it is common knowledge → hold on their face while they recalculate → button.",
  },
  {
    key: "fake-specifics",
    name: "Too many details to argue with",
    description:
      "They push back, so you escalate — not by insisting, but by adding invented specifics that sound checkable.",
    structure:
      "They say 'no, I'm pretty sure' → agree that it is a common mistake → add a fake year, a fake source, a fake person's name → watch the confidence drain → let them go quiet → button.",
  },
  {
    key: "crowd-turn",
    name: "Asking someone else",
    description:
      "Turn to a second stranger, who either backs the wrong answer or makes it worse.",
    structure:
      "'Let's settle it' → turn to a bystander → they side with the wrong answer, or give a third answer that is worse → cut to the first person's face → button.",
  },
  {
    key: "slow-doubt",
    name: "Watching them fold",
    description:
      "Say nothing more and let them talk themselves out of the answer they already knew.",
    structure:
      "One quiet 'are you sure?' → do not fill the silence → they start reasoning out loud and walk backwards → the moment they change their answer → button.",
  },
  {
    key: "the-reveal",
    name: "Telling them the truth",
    description:
      "You were right the whole time. The payoff is their reaction to being let off.",
    structure:
      "Let it sit one beat too long → 'you were right, I was messing with you' → their reaction, uncut → the handshake or the shove → button.",
  },
];

const tallyFormats: Format[] = [
  {
    key: "what-it-is",
    name: "What Tally is",
    description:
      "The plain introduction. Someone has never heard of it; by the end they know what it does and why it exists.",
    structure:
      "Open on the frustration of not being heard by your representatives → 'there's an app that measures exactly that' → name it → show the one-to-five rating on screen → show the district result appearing → the alignment score → what to do next.",
  },
  {
    key: "the-alignment-score",
    name: "The number nobody else shows you",
    description:
      "Introduce Tally through its one genuinely unusual feature: your rep's voting record measured against your district.",
    structure:
      "Ask whether your rep votes the way your area actually thinks → 'nobody could answer that until now' → show the alignment score on screen → explain in one line that it comes from recorded votes, not statements → show a real official → invite them to look up theirs.",
  },
  {
    key: "thirty-second-tour",
    name: "The thirty-second tour",
    description:
      "Open the app and show what a first-time user actually sees and does.",
    structure:
      "'This is the whole app' → open it → pick a topic → rate it one to five → the district split appears → the party lenses → the bill and the recorded vote → 'that's it, that's the app'.",
  },
  {
    key: "one-local-issue",
    name: "One issue, start to finish",
    description:
      "Introduce Tally through a single real NYC issue the viewer already has an opinion about.",
    structure:
      "Name the issue — station bathrooms, broken AC, missing elevators, weekend shutdowns → 'everyone has an opinion and nowhere to put it' → open Tally on that exact topic → rate it → show where the district lands → show what the Council actually did → the ask.",
  },
  {
    key: "the-privacy-answer",
    name: "Who sees my answer",
    description:
      "The question that stops people installing, answered up front. An introduction built on trust.",
    structure:
      "'The first thing people ask is who sees this' → the answer: nobody, ever, including officials → show that results only appear as aggregates → one line on why an account exists at all → 'now here is what it does'.",
  },
];

export const SUPERSEDED_MISSIONS = new Set<string>([
  "Break real AI news. Every video starts from an actual headline from the last few days — what happened, why it matters, and what the viewer should do about it. Also covers tools and sites worth opening today. Credibility comes from being accurate, specific and fast about things that genuinely exist. This is the channel brands in the AI space pay to be next to, and the top of the funnel for Tally.",
  "Volume and reach. Dramatic, funny reactions to absurdly gross Instagram reels. This is the channel that grows fastest and costs the least to make.",
  "Market Tally. Every video introduces the app to someone who has never heard of it and shows them why it is worth opening — by naming a frustration they have actually had and then showing the app solving it on screen. Judged on installs and polls created, not views: a 4k-view video that converts beats a 90k-view video that does not.",
  "Keep people current on AI. Real news, real tools, real applications — what actually happened, what it means, and what is worth opening today. Credibility comes from being accurate and specific about things that genuinely exist, faster than the people around them. This is the channel brands in the AI space pay to be next to, and the top of the funnel for Tally.",
  "Establish real credibility on AI by being consistently more precise than everyone else in the feed. This channel is the top of the funnel for Tally — a viewer who trusts the explanations is a viewer who will try the app.",
  "Drive installs of Tally, a civic polling app. Judged on installs and poll creations, not views. A 4k-view video that converts beats a 90k-view video that does not.",
]);

export const CHANNEL_SEED = [
  {
    id: "ai",
    logo: "/logos/ai-with-receipts.png",
    name: "AI News",
    handle: null,
    accent: "#2A62A8",
    mission:
      "Break real AI news. Every video starts from an actual headline from the last few days — what happened, why it matters, and what the viewer should do about it. Also covers tools and sites worth opening today. Credibility comes from being accurate, specific and fast about things that genuinely exist. This is the channel brands in the AI space pay to be next to, and the top of the funnel for Tally.",
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
    styleNotes: [
      "Three creators to borrow craft from. Study the technique, never imitate the person — no catchphrases, no borrowed bits, no pretending to be them.",
      "",
      "KALLAWAY (@kanekallaway) — structure.",
      "He treats the first three seconds as the whole video, then never lets the tension close. One hook is not enough: each segment opens a new curiosity loop before the last one resolves, so there is always an unanswered question pulling the viewer forward. Complex tech gets made accessible without being dumbed down, and every breakdown lands on something the viewer can actually use. Take from him: the layered curiosity loops, and the discipline of never explaining something the viewer did not ask to know.",
      "",
      "DYLAN PAGE (@dylan.page) — delivery and pace.",
      "News told with energy and personality rather than authority. Brisk, warm, genuinely interested — the tone of someone who just found out and had to tell you, not a presenter reading a bulletin. He makes a complicated or surprising story feel immediately graspable, and leaves room for the viewer to have an opinion, which is why his videos get argued with rather than scrolled past. Take from him: the pace, the enthusiasm, and ending on something people want to reply to.",
      "",
      "WILL FRANCIS (@willfrancis24) — substance and honesty.",
      "Hype-free and genuinely useful. Explains AI so a normal person leaves with something they can do, not a feeling that the future is scary or amazing. No breathlessness, no doom. Take from him: the refusal to hype, and the rule that a viewer should be able to act on the video within a day.",
      "",
      "The combination: Kallaway's structure, Dylan Page's energy, Will Francis's honesty. Fast and warm, built on curiosity loops, and never overselling what actually happened.",
    ].join("\n"),
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
    name: "Instagram Reels Reactions",
    handle: null,
    accent: "#71469E",
    mission:
      "Volume and reach. Dramatic, funny reactions to the most absurd and grotesque corners of Instagram Reels — the food crimes, the unhinged thirst-trap monologues, the things that should not have been filmed. Fastest to grow and cheapest to make, and the channel that feeds followers to the other three.",
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
    styleNotes: [
      "WHERE THE MATERIAL COMES FROM",
      "The clip queue is the bottleneck, not the writing. Stock it from the corners that reliably produce: unhinged thirst-trap monologues where someone says something genuinely deranged with total confidence, food crimes and impossible-texture cooking, home renovation and DIY that defies physics, mukbang gone wrong, and the pages that exist purely to bait a reaction.",
      "Save them to a collection as you find them, and log the link plus a one-line premise here the same day. Never go looking on a record day.",
      "",
      "ONE CATEGORY TO LEAVE ALONE — real fights and real violence.",
      "TikTok explicitly prohibits real-world physical violence and fighting as shocking content, and content that breaks the guidelines is disqualified from earning and from brand deals. Since the point of these accounts is money, a fight clip costs more than it returns: the video is suppressed, the post earns nothing, and repeated strikes take the account down. Gross, absurd, and unhinged all monetise. Violent does not.",
      "",
      "THE DELIVERY",
      "Your face is the product, not the clip. Crop so you are large in frame and the source is small. React across the whole clip rather than watching in silence — the commentary is also what makes it transformative rather than a repost, which is what stops it being pulled for copyright.",
    ].join("\n"),
    mode: "sources" as const,
    scriptStyle: "beats" as const,
    cadencePerWeek: 6,
    targetDepth: 10,
    recordDays: [2],
    sortOrder: 4,
  },
  {
    id: "streettalk",
    logo: "/logos/streettalk.png",
    name: "Street Talk",
    handle: null,
    accent: "#C2571E",
    mission:
      "Stop strangers on the street, ask them an easy trivia question, and when they get it right, insist with total confidence that they are wrong. The comedy is the flat certainty and the face they make while they recalculate — never the person. Fast to make, endlessly repeatable, and the format people send to a friend, which is the signal that grows an account.",
    audience:
      "People who watch street-interview and prank content and stay for the reaction shot. They are on your side, not the stranger's, but they turn on a host who is actually cruel.",
    voice:
      "Deadpan and friendly. Utterly sure of something completely wrong, delivered as casually as the weather. Never smug, never mocking — you are not laughing at them, you are holding a straight face. The warmer you are, the funnier the lie.",
    formats: streetFormats,
    neverDo: [
      "Punching down. Never pick someone who is drunk, distressed, unhoused, a child, or struggling with the language. The bit only works on someone comfortably able to push back.",
      "Leaving without the reveal. Always tell them the truth on camera before you go — that is the payoff, and it is what keeps this a joke rather than a nasty trick.",
      "Posting anyone who asks you not to. Get a clear yes on camera. One person's bad day is not worth a video.",
      "Questions where being wrong is humiliating rather than funny. Keep it capitals, spelling, simple history — nothing that makes someone look uneducated about their own life.",
      "Real politics, religion, or anything someone could be doxxed over.",
      "Arguing. The moment it stops being funny and becomes a real disagreement, you drop it and reveal.",
    ],
    cta: null,
    productNotes: null,
    mode: "questions" as const,
    styleNotes:
      "The whole format lives in the pause. Ask, let them answer, and then do nothing for a full beat before you correct them — the silence is what makes the correction land and what makes the clip rewatchable. Shoot so their face is the subject, not yours: you can be off-camera entirely. Keep your own delivery low-energy; their reaction supplies all the energy the video needs.",
    scriptStyle: "beats" as const,
    cadencePerWeek: 5,
    targetDepth: 8,
    recordDays: [6],
    sortOrder: 2,
    newsDriven: false,
  },
  {
    id: "tally",
    logo: "/logos/tally.png",
    name: "Tally",
    handle: null,
    accent: "#1F7A5C",
    mission:
      "Market Tally. Open on a frustration the viewer already has about being ignored by the people who represent them — \"aren't you tired of your representatives not listening to you?\" — then show the app answering it on screen. The alignment score is the payoff almost every time, because it is the literal measurement of whether your rep votes the way your district actually thinks. Judged on installs and polls created, not views: a 4k-view video that converts beats a 90k-view video that does not.",
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
    productNotes: [
      "Tally is a civic app. You weigh in on issues, bills and officials on a 1 to 5 scale, and it shows how your district actually leans — then lines that up against how your representatives actually voted.",
      "",
      "THE THING THAT MAKES IT DIFFERENT — the alignment score.",
      "It compares how an official really voted on an issue against how their district really weighed in on that same issue. High alignment means their record tracks their constituents. Low means it does not. It is computed from recorded votes, not from what they say. This is the feature to lead with: it is the answer to 'my rep does not listen to me', and nothing else on a phone does it.",
      "",
      "WHAT YOU CAN DO IN THE FIRST THIRTY SECONDS",
      "Open it, pick a topic you have an opinion about, rate it 1 to 5, and immediately see how your district, each party and the country split on it.",
      "",
      "WHAT IS IN IT",
      "- Real bills with plain-English summaries, sponsor, and current status — passed committee, stalled, on the floor.",
      "- Real recorded votes from Congress.gov, the New York State Senate, and the NYC Council. Refreshed every hour.",
      "- Approval: a separate 1 to 5 on the official themselves, shown as a distribution.",
      "- Lenses: see results broken down by party and by area.",
      "",
      "PRIVACY, which matters because people ask",
      "Individual answers are never shown to anyone, including officials. You only ever appear inside aggregates, and aggregates only appear once enough people have weighed in that nobody is identifiable. An account exists so each person counts once, in the right district. Settings has Download my data and Clear activity, and emailing the address on the privacy page deletes everything.",
      "",
      "IT TAKES NO SIDES",
      "Tally does not hold positions. Everyone sees the same distributions, computed the same way. Red and blue only ever mark Republican and Democrat.",
      "",
      "WHERE IT IS STRONGEST RIGHT NOW",
      "New York City. The local topics are the sharp ones: subway cleanliness, station bathrooms, broken AC, missing elevators, delays, fare gates, weekend shutdowns, platform barriers, policing. Those are the pain points to build videos on, because everyone in the city has an opinion already formed and no way to register it.",
      "",
      "HONEST LIMIT — say this rather than hide it",
      "Where the community is still small, the app says so instead of inventing numbers. Bills, votes and official records are always real.",
    ].join("\n"),
    scriptStyle: "full" as const,
    cadencePerWeek: 3,
    targetDepth: 4,
    recordDays: [0, 3],
    sortOrder: 3,
  },
];
