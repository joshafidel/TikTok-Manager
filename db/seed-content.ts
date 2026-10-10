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
