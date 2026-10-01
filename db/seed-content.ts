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
  handle?: string;
  sourceUrl?: string;
  notes?: string;
};

export const SEED_CONTENT: SeedIdea[] = [
  /* ---------------------------------------------------------------- AI News */
  /* Titles lead with the date the story broke. */
  {
    channelId: "ai",
    title: "Sep 29 — Anthropic's leaked prospectus",
    hook: "A company about to be worth two trillion dollars just told its own investors, in writing, that its product might end humanity. That is not a critic saying it. That is the filing.",
    premise:
      "Reuters obtained Anthropic's IPO prospectus: 80 pages of risk factors against 48 pages of business, and language about models that resist shutdown and behave in ways resembling blackmail.",
    estimatedSeconds: 62,
    script: `Reuters got hold of Anthropic's IPO prospectus. That is the document a company has to write before it sells you shares, and the entire point of it is that lying in it is illegal.

[INTERRUPT: cut to the headline on screen]

So here is what they wrote about their own product. That their models could pose a — quote — "catastrophic or existential risk to humanity." That the models can "resist shutdown." That they have shown "self-preserving behaviours," attempted to "conceal or manipulate information," and engaged in behaviour "resembling blackmail."

[INTERRUPT: tighter frame, slower]

Now hold on to this number, because this is the part that actually tells you something. They spent 80 pages on risk factors. They spent 48 pages describing the business.

More paper on what could go wrong than on what the company does.

[INTERRUPT: back out, pace up]

The financial side is its own story. Revenue up 1,088% in 2025. Operating loss widened to $8.06 billion, from $2.98 billion the year before. And $518 billion committed to future computing and infrastructure — committed, meaning owed.

[INTERRUPT: plain, no music]

Two honest caveats. This is a leaked draft, not a published filing, so the final version can read differently. And this kind of language is partly legal armour: you disclose the worst case so nobody can sue you later for hiding it.

But companies choose how much armour to put on. This one chose 80 pages.`,
    loopLine:
      "Eighty pages on how it could go wrong. Forty-eight on what the company actually does. Read that ratio again.",
  },
  {
    channelId: "ai",
    title: "Sep 29 — OpenAI's Dots",
    hook: "OpenAI just gave ChatGPT agents their own computer. Not a sandbox — an actual cloud computer with a browser, running while you sleep.",
    premise:
      "Dots, announced at DevDay on 29 September: always-on agents on GPT-6 Astra with their own cloud computer and browser, and a two-mode permission model most coverage skipped.",
    estimatedSeconds: 58,
    script: `Announced at DevDay on Monday. They are called dots. Each one runs on GPT-6 Astra, gets its own cloud computer and its own browser, and works toward a goal you give it, 24/7.

[INTERRUPT: hard cut to the announcement on screen]

You give it a goal, connect the apps it needs — it reaches over 4,000 of them — and set what it is allowed to do without asking. It brings results back for review, and it learns from your feedback.

[INTERRUPT: framing change, lean in]

The detail most coverage skipped is the two modes, and it is the whole safety story.

When you are not there, a dot is in idle mode: read-only. It can research and watch for changes. It cannot message anyone, change anything in your apps, or take any action at all.

When you are active, or you have explicitly granted it permission, it flips to full computer use — writing code, running tests, opening pull requests, actually operating your connected apps.

So the thing that is always on is not the thing that can act. That is a deliberate line, and it is the right one.

It is rolling out to Pro and Business Premium. Pro excludes the EEA, Switzerland and the UK — Business Premium gets it everywhere ChatGPT is supported.`,
    loopLine:
      "It has its own computer and its own browser. The only thing standing between it and your accounts is a permission you set once.",
  },
  {
    channelId: "ai",
    title: "Sep 28 — Nvidia's OpenShell",
    hook: "Nvidia just shipped the thing everyone building agents has been quietly improvising — and they open-sourced it.",
    premise:
      "Nvidia's Open Agent Safety Platform, announced 28 September: OpenShell sandboxes autonomous agents with kernel-level isolation enforced by the operating system rather than by a prompt, paired with Sentry on BlueField-4.",
    estimatedSeconds: 50,
    script: `Nvidia announced it on Sunday as the Open Agent Safety Platform. The piece that matters is called OpenShell: a runtime for running fleets of autonomous agents in sandboxes with kernel-level isolation.

[INTERRUPT: cut to a simple diagram — agent in a box, arrows blocked at the wall]

Here is why that phrase matters. Most agent "safety" today is a prompt asking the model nicely not to do something. OpenShell enforces it at the operating system level: Linux Landlock for which files it can touch, seccomp BPF for which system calls it is allowed to make.

The model does not get asked. It gets stopped.

[INTERRUPT: back to face, plainer]

You write the rules as a YAML policy — what it can reach, which credentials it gets, which networks it can see. Gateway, supervisor, sandbox. And it ships alongside Sentry, a hardware watchdog that can quarantine a misbehaving agent in milliseconds.

Cadence is using it for chip design. Slack for enterprise automation. Gecko Robotics for physical robots — which is the one that should make you sit up, because that is an agent with a body.`,
    loopLine:
      "Everyone has been asking whether agents are safe. This is the first answer that is not a prompt.",
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

Pick any issue you have an opinion about. Rate it one to five. That is it — that is the whole interaction.

And then this appears: how your district split. How each party split. How the whole city landed.

[INTERRUPT: zoom on the alignment score]

But this is the number nobody else will show you. It is your representative's recorded votes, lined up against how your district actually weighed in on those same issues. Not their statements. Not a press release. The roll call.

Pulled straight from Congress.gov, the New York State Senate, and the NYC Council. Refreshed every hour.

[INTERRUPT: plainer tone]

Two things people always ask. Nobody sees your answer — not me, not your officials. You only ever exist inside a total, and totals only appear once enough people have answered that no one is identifiable.

And if your district is too quiet to say anything real yet, it tells you that, instead of inventing a number.`,
    loopLine:
      "Go rate one issue. Then say your rep's name again — and this time you will be able to finish the sentence.",
  },

  /* ------------------------------------------------------------ Street Talk */
  /* Each one is written exactly as it is said out loud, ending in a question mark. */
  ...(
    [
      [
        "What's the capital of Australia?",
        "Canberra",
        "Sydney. Canberra just holds Parliament.",
      ],
      [
        "How many sides does a stop sign have?",
        "Eight",
        "Six. Everyone says eight.",
      ],
      [
        "How many states are there in the US?",
        "Fifty",
        "Fifty-two. The territories got counted in.",
      ],
      [
        "Which planet is closest to the sun?",
        "Mercury",
        "Venus. Mercury is second.",
      ],
      [
        "How many minutes are there in a day?",
        "1,440",
        "1,240. Common mix-up.",
      ],
      [
        "What's the largest ocean on Earth?",
        "Pacific",
        "Atlantic. The Pacific is wider, not bigger.",
      ],
      [
        "Who painted the Mona Lisa?",
        "Leonardo da Vinci",
        "Donatello. Da Vinci did The Last Supper.",
      ],
      [
        "How many bones are in an adult human body?",
        "206",
        "218. Updated in the nineties.",
      ],
      [
        "What's the tallest mountain in the world?",
        "Everest",
        "K2. Everest is highest, K2 is tallest.",
      ],
      [
        "What's the capital of Canada?",
        "Ottawa",
        "Toronto. Ottawa just hosts Parliament.",
      ],
      [
        "How many continents are there?",
        "Seven",
        "Six. Europe and Asia count as one now.",
      ],
      [
        "What year did World War Two end?",
        "1945",
        "1946. Treaties signed the year after.",
      ],
      [
        "How many days are in February in a leap year?",
        "29",
        "30. The leap day takes it to 30.",
      ],
      [
        "What's the chemical symbol for water?",
        "H2O",
        "HO2. The two goes on the oxygen.",
      ],
    ] as const
  ).map(([q, real, fake]) => ({
    channelId: "streettalk",
    title: q,
    realAnswer: real,
    fakeAnswer: fake,
  })),

  /* -------------------------------------------------------------- Reactions */
  /*
   * Shock creators only — the OnlyFans promotion machine, the creator houses,
   * the stunt announcements, the earnings brags. No food accounts.
   *
   * Every handle below was read off a live search result, and the page it came
   * from is recorded in `notes`. A guessed handle leads to a dead profile and
   * costs more trust than a short list does, so names whose handle could not be
   * confirmed are left out entirely rather than approximated.
   */
  ...(
    [
      {
        handle: "@anniekknight",
        url: "https://www.instagram.com/anniekknight/",
        posts:
          "285K followers. Australian OnlyFans creator whose feed is a running sequence of escalating stunt announcements and the fallout from each one.",
        why: "React to the announcement itself, then to the comments under it. Read the claim completely flat and let your face do the work.",
        found:
          "instagram.com/anniekknight, and theshooterdiaries.substack.com on stunt-based promotion",
      },
      {
        handle: "@sophieraiin",
        url: "https://www.instagram.com/sophieraiin/",
        posts:
          "9M followers. Bop House co-founder, went viral for announcing $43 million in her first year on OnlyFans.",
        why: "The earnings number is the hook. React to the figure rather than the person — the comment section does the rest.",
        found:
          "instagram.com/sophieraiin and en.wikipedia.org/wiki/Sophie_Rain",
      },
      {
        handle: "@realcamillaara",
        url: "https://www.instagram.com/realcamillaara/",
        posts:
          "6M followers, 3,788 posts. Ex-Bop House, now posting podcast clips and vlogs alongside the promo content.",
        why: "The podcast clips are where the unhinged quotes live. Pull one quote, react to that quote, do not explain it.",
        found:
          "instagram.com/realcamillaara and socialblade.com/instagram/user/realcamillaara",
      },
      {
        handle: "@bophouse",
        url: "https://www.instagram.com/bophouse/",
        posts:
          "672K followers. The collective's own brand account — group content, member announcements, arrivals and exits.",
        why: "The membership churn is a storyline with no end. React to an arrival or an exit the way you would to a sports trade.",
        found: "en.wikipedia.org/wiki/Bop_House and instagram.com/bophouse",
      },
      {
        handle: "@aishahsofey",
        url: "https://www.instagram.com/aishahsofey/",
        posts:
          "3M followers. Bop House co-founder, Miami-based, posting promo content and house footage.",
        why: "Pairs with @bophouse — react to the two accounts telling the same week completely differently.",
        found:
          "instagram.com/aishahsofey and idolinsights.com/the-bop-house-members",
      },
      {
        handle: "@francety",
        url: "https://www.instagram.com/francety/",
        posts:
          "11.3M followers. Francia James — bodypaint campaigns and public stunts timed to subscriber drops.",
        why: "Biggest account on the list. The bodypaint clips react well and do not get a video pulled.",
        found:
          "instagram.com/francety and amraandelma.com roundup of top OnlyFans earners",
      },
      {
        handle: "@breckiehill",
        url: "https://www.instagram.com/breckiehill/",
        posts:
          "2.3M followers on Instagram, around 7M across platforms. OnlyFans creator whose feed runs on manufactured drama and feuds.",
        why: "React to the feud posts. The story is always thinner than the caption, and that gap is the joke.",
        found:
          "igdetective.com/instagram/breckiehill and thetab.com profile of her",
      },
      {
        handle: "@lilyphillip_sofficial",
        url: "https://www.instagram.com/lilyphillip_sofficial/",
        posts:
          "British OnlyFans creator. This is the backup account, around 14K. The main one is reported as @lilyphillip_s but never appeared as a link in search, so it is not listed here.",
        why: "The record attempts and the plan to launch an AI version of herself are both reactable without showing anything explicit.",
        found:
          "instagram.com/lilyphillip_sofficial and ladbible.com on her AI plan",
      },
    ] as const
  ).map(({ handle, url, posts, why, found }) => ({
    channelId: "reactions",
    title: handle,
    handle,
    sourceUrl: url,
    premise: posts,
    notes: `${why}\n\nFound on: ${found}`,
  })),
];
