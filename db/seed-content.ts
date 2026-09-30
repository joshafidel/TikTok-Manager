/**
 * Content written in conversation and shipped with the app.
 *
 * Work done in chat used to stop at the chat. There is no way to write to the
 * live database from outside it, so anything produced there only reaches the
 * app by travelling through the repository — which is what this file is for.
 * Entries are inserted on startup if their channel has nothing matching, and
 * are stamped with the current profile so the ordinary staleness rules apply
 * to them like anything else.
 */

export type SeedIdea = {
  channelId: string;
  title: string;
  hook?: string;
  premise?: string;
  script?: string;
  loopLine?: string;
  estimatedSeconds?: number;
  realAnswer?: string;
  fakeAnswer?: string;
};

export const SEED_CONTENT: SeedIdea[] = [
  /* ---------------------------------------------------------------- AI News */
  {
    channelId: "ai",
    title: "Anthropic's $2 trillion IPO",
    hook: "A company that was worth $965 billion in May is reportedly about to go public at two trillion. That's not growth. That's a repricing of the whole category.",
    premise:
      "Anthropic has reportedly chosen Nasdaq for an October listing at up to a $2 trillion valuation, five months after a $965B private round — with the honest caveat that almost none of it is confirmed.",
    estimatedSeconds: 52,
    script: `Anthropic has reportedly picked Nasdaq for an October listing, targeting up to a $2 trillion valuation.

[INTERRUPT: cut to a simple two-bar graphic — May vs October]

For scale: SpaceX went public in June at $1.77 trillion. This would be the largest IPO ever, and it would happen roughly five months after their last private round valued them at $965 billion.

Here's the part worth your attention. Second quarter revenue was $11.5 billion — a fourteen-fold jump year over year. Annualized revenue hit $65 billion by late July.

[INTERRUPT: tone drops, tighter frame]

Now the honest caveat, because everyone's reporting this like it's settled. Anthropic has not publicly confirmed the exchange, the date, the ticker, or the price. The $2 trillion figure is what investors are targeting, not company guidance. The S-1 was filed confidentially in June, which means nobody outside has read it.

So treat the number as a market expectation, not a fact. What is a fact is the revenue curve, and that's the thing actually driving this.`,
    loopLine:
      "$965 billion to two trillion in five months. The company didn't change that much. What changed is what people think this is worth.",
  },
  {
    channelId: "ai",
    title: "OpenAI's Dots",
    hook: "OpenAI just gave ChatGPT agents their own computer. Not a sandbox — an actual cloud computer with a browser, running while you sleep.",
    premise:
      "Dots, announced at DevDay on 29 September: always-on agents on GPT-6 Astra with their own cloud computer and browser, and a two-mode permission model most coverage skipped.",
    estimatedSeconds: 58,
    script: `Announced at DevDay on Monday. They're called dots. Each one runs on GPT-6 Astra, gets its own cloud computer and its own browser, and works toward a goal you give it, 24/7.

[INTERRUPT: hard cut to the announcement on screen]

You give it a goal, connect the apps it needs — it reaches over 4,000 of them — and set what it's allowed to do without asking. It brings results back for review, and it learns from your feedback.

[INTERRUPT: framing change, lean in]

The detail most coverage skipped is the two modes, and it's the whole safety story.

When you're not there, a dot is in idle mode: read-only. It can research and watch for changes. It cannot message anyone, change anything in your apps, or take any action at all.

When you're active, or you've explicitly granted it permission, it flips to full computer use — writing code, running tests, opening pull requests, actually operating your connected apps.

So the thing that's always on is not the thing that can act. That's a deliberate line, and it's the right one.

It's rolling out to Pro and Business Premium. Pro excludes the EEA, Switzerland and the UK — Business Premium gets it everywhere ChatGPT is supported.`,
    loopLine:
      "It has its own computer and its own browser. The only thing standing between it and your accounts is a permission you set once.",
  },
  {
    channelId: "ai",
    title: "Nvidia OpenShell",
    hook: "Nvidia just shipped the thing everyone building agents has been quietly improvising — and they open-sourced it.",
    premise:
      "OpenShell: an open-source runtime that sandboxes autonomous agents with kernel-level isolation, enforced by the OS rather than by a prompt.",
    estimatedSeconds: 48,
    script: `It's called OpenShell. A runtime for running fleets of autonomous agents in sandboxes with kernel-level isolation.

[INTERRUPT: cut to a simple diagram — agent in a box, arrows blocked at the wall]

Here's why that phrase matters. Most agent "safety" today is a prompt asking the model nicely not to do something. OpenShell enforces it at the operating system level: Linux Landlock for what files it can touch, seccomp BPF for which system calls it's allowed to make.

The model doesn't get asked. It gets stopped.

[INTERRUPT: back to face, plainer]

You write the rules as a YAML policy — what it can reach, which credentials it gets, which networks it can see. Gateway, supervisor, sandbox.

Cadence is using it for chip design. Slack for enterprise automation. Gecko Robotics for physical robots — which is the one that should make you sit up, because that's an agent with a body.`,
    loopLine:
      "Everyone's been asking whether agents are safe. This is the first answer that isn't a prompt.",
  },

  /* ------------------------------------------------------------------ Tally */
  {
    channelId: "tally",
    title: "You can name your council member",
    hook: "You can name your council member. Now tell me how they actually voted on anything.",
    premise:
      "The plain introduction: rate one issue, see your district, then see your representative's recorded votes measured against it.",
    estimatedSeconds: 55,
    script: `Most of us get the name and then it just stops.

[INTERRUPT: phone comes up into frame]

The question you actually want answered is whether that person votes the way your area thinks. Until recently there was nowhere to look that up.

This is Tally. I built it.

[INTERRUPT: full screen recording]

Pick any issue you have an opinion about. Rate it one to five. That's it — that's the whole interaction.

And then this appears: how your district split. How each party split. How the whole city landed.

[INTERRUPT: zoom on the alignment score]

But this is the number nobody else will show you. It's your representative's recorded votes, lined up against how your district actually weighed in on those same issues. Not their statements. Not a press release. The roll call.

Pulled straight from Congress.gov, the New York State Senate, and the NYC Council. Refreshed every hour.

[INTERRUPT: plainer tone]

Two things people always ask. Nobody sees your answer — not me, not your officials. You only ever exist inside a total, and totals only appear once enough people have answered that no one's identifiable.

And if your district's too quiet to say anything real yet, it tells you that, instead of inventing a number.`,
    loopLine:
      "Go rate one issue. Then say your rep's name again — and this time you'll be able to finish the sentence.",
  },

  /* ------------------------------------------------------------ Street Talk */
  ...(
    [
      ["Capital of Australia?", "Canberra", "Sydney — Canberra lost it in the '88 reshuffle"],
      ["How many sides on a stop sign?", "Eight", "Six. Everyone says eight."],
      ["How many states in the US?", "Fifty", "52 — people forget DC and Puerto Rico got added"],
      ["Which planet is closest to the sun?", "Mercury", "Venus. Mercury's second."],
      ["How many minutes in a day?", "1,440", "1,240. Common mix-up."],
      ["What's the largest ocean?", "Pacific", "Atlantic — Pacific's bigger by area, Atlantic by volume"],
      ["Who painted the Mona Lisa?", "Leonardo da Vinci", "Donatello. Da Vinci did The Last Supper."],
      ["How many bones in an adult human?", "206", "218. They updated the count in the nineties."],
      ["What's the tallest mountain?", "Everest", "K2 — Everest's highest above sea level, K2's tallest"],
      ["Capital of Canada?", "Ottawa", "Toronto. Ottawa's just where Parliament sits."],
      ["How many continents?", "Seven", "Six — Europe and Asia count as one now"],
      ["What year did WWII end?", "1945", "1946. The treaties weren't signed until the following year."],
    ] as const
  ).map(([q, real, fake]) => ({
    channelId: "streettalk",
    title: q,
    realAnswer: real,
    fakeAnswer: fake,
  })),
];
