# TikTok Manager

A content operations app for running three TikTok channels off one calendar.
It generates ideas and scripts against per-channel voice profiles, tracks every
video through a production pipeline, and tells you what to record and what to
post each day.

It deliberately **does not publish to TikTok**. See [Why there's no
publishing](#why-theres-no-publishing).

## Quick start

```bash
npm install
cp .env.example .env.local     # add your ANTHROPIC_API_KEY
npm run db:migrate             # creates data/app.db
npm run db:seed                # loads the three channel profiles
npm run dev
```

Open <http://localhost:3000>.

## The model

A video is not a calendar event, it's a pipeline with a state:

```
idea → scripted → recorded → edited → scheduled → posted
```

Two things make this work for video specifically:

**Two dates per item.** `record_on` and `post_on` are separate, because you
batch-record twice a week but post every day. A single date can't express that,
which is why generic content calendars feel wrong here.

**Pipeline depth.** Each channel has a `targetDepth` — how many edited videos
should be banked. When the count drops below it, the Today view stops
suggesting ideas and starts asking for a record session. That one alert is what
keeps a three-channel operation from going dark.

## Screens

| Route | What it's for |
|---|---|
| `/` | Today: what to post, what to film, depth per channel, the next seven days |
| `/calendar` | Month grid over both dates. Filled dot = post, outline = record |
| `/pipeline` | Board by status, plus manual entry |
| `/clips` | Source queue for the reaction channel |
| `/channels` | The three profiles |
| `/channels/[id]` | Generate ideas, cull the list, edit the profile, format library |
| `/items/[id]` | Script, shot notes, caption, scheduling, performance |

## Channel profiles are the product

Everything generated is written against the profile in `db/seed.ts`: mission,
audience, voice, a format library, and an explicit **never do** list. That last
field does more work than any other — it's the difference between usable ideas
and generic slop.

Three channels ship seeded:

- **AI, with receipts** — full scripts, 4/week. Bottleneck is visuals, not writing.
- **Reactions** — beat sheets (reading a reaction kills it), 6/week. Bottleneck is sourcing, which is what `/clips` exists for.
- **Tally** — full scripts, 3/week. Judged on installs, not views.

Edit them in the app at `/channels/[id]`, or in `db/seed.ts` before first seed.
Rewrite them in your own words — they were drafted from a brief, not from
watching you talk.

## How generation works

`lib/claude.ts` calls `claude-opus-5` with adaptive thinking and structured
outputs (Zod schemas validated at the API layer, so there's no JSON parsing to
go wrong). The channel profile is sent as a cached system prompt, so repeated
generations against the same channel are cheap.

- **Ideas** run at `effort: "medium"` and land straight in the channel's idea
  list. Generate twelve, keep three — rejects are one click, and recent titles
  are fed back in so batches don't repeat themselves.
- **Scripts** run at `effort: "high"` and produce a full script or a beat sheet
  depending on the channel's `scriptStyle`, plus shot notes, caption and
  hashtags.
- Logged performance numbers feed back into idea generation as "these landed".

Server-side refusal fallbacks are enabled, so a single odd prompt doesn't
dead-end the writer's room.

## Why there's no publishing

TikTok's Content Posting API forces every direct post to `SELF_ONLY` visibility
until your app passes a formal audit — which wants a recorded demo, a privacy
policy, and evidence the integration ships inside a finished product. That's
weeks of work for a personal tool.

So this app owns ideas, scripts, and the calendar; publishing happens in
**TikTok Studio's** native scheduler (free, schedules 10 days out), or in
Metricool/Buffer if you want all three accounts on one dashboard. Both need
TikTok **Business** accounts — personal accounts can't connect to any
third-party scheduler.

If you later want posting in-app, the realistic path is the Upload flow
(drops a video into your TikTok inbox as a draft, you finish it in the app),
or self-hosting Postiz and inheriting its API access.

## Running it on your phone

You will check "what do I post today" on your phone. The UI is responsive; the
default SQLite file is not. Point `DATABASE_URL` at a [Turso](https://turso.tech)
database and set `DATABASE_AUTH_TOKEN` — the libsql client is the same either
way — then deploy to Railway or Vercel.

## Stack

Next.js 15 (App Router, server actions), TypeScript, Drizzle ORM over
libsql/SQLite, Tailwind v4, `@anthropic-ai/sdk`.

Single user by design. Don't make it multi-tenant.

## Scripts

```bash
npm run dev          # dev server
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run db:generate  # regenerate migrations after editing db/schema.ts
npm run db:migrate   # apply migrations
npm run db:seed      # upsert channel profiles
npm run db:reset     # wipe data/app.db and rebuild it
```
