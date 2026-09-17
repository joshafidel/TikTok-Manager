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
npm run dev
```

The app creates its own tables and loads the three channel profiles the first
time it touches the database, so there is no migration step — locally or on a
fresh deployment.

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

## Getting it on your phone

The app is a responsive web app, so "on your phone" means deploying it and
adding it to your home screen. It ships a web manifest and icons, so it opens
standalone without browser chrome.

### 1. A database that survives

Vercel's filesystem is ephemeral — a SQLite file would be wiped on every
deploy. Use [Turso](https://turso.tech), which speaks the same libsql protocol,
so no code changes are needed:

```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth signup
turso db create tiktok-manager
turso db show tiktok-manager --url        # -> DATABASE_URL
turso db tokens create tiktok-manager     # -> DATABASE_AUTH_TOKEN
```

Then point your local env at it once and push the schema up:

```bash
DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:migrate
DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:seed
```

### 2. Deploy

Import the repo at [vercel.com/new](https://vercel.com/new) and set four
environment variables (Project → Settings → Environment Variables):

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your key from [console.anthropic.com](https://console.anthropic.com) |
| `APP_PASSWORD` | Any long random string — this is your login |
| `DATABASE_URL` | `libsql://...` from Turso |
| `DATABASE_AUTH_TOKEN` | The Turso token |

Everything else is default. Framework detection picks up Next.js on its own.

### 3. Add to home screen

Open the deployed URL on your phone, sign in, then Share → **Add to Home
Screen** (iOS) or menu → **Install app** (Android). The session cookie lasts 30
days, so you sign in about once a month.

### Notes

- **The password gate is not optional.** A deployed instance with no
  `APP_PASSWORD` refuses to serve at all, because an open URL would expose your
  content and let anyone spend your Anthropic credit.
- Script generation runs adaptive thinking at high effort and can take a couple
  of minutes. The generation pages set `maxDuration = 300`, which Vercel's Hobby
  plan allows under Fluid Compute (on by default).
- If you'd rather not deploy at all, run `npm run dev` on your laptop and reach
  it from your phone over the local network or Tailscale. No hosting, no
  password needed — but the laptop has to be awake.

## Stack

Next.js 15 (App Router, server actions), TypeScript, Drizzle ORM over
libsql/SQLite, Tailwind v4, `@anthropic-ai/sdk`.

Single user by design — one password, one operator. Don't make it multi-tenant.

## Editor tooling (MCP)

`.mcp.json` declares the MCP servers this project uses when working on it in
Claude Code, copied from the nyfoodies repo:

| Server | What it's for |
|---|---|
| `firecrawl` | Scraping and crawling pages — useful for sourcing clips and trend research |
| `perplexity` | Research lookups |
| `playwright` | Driving a browser |
| `chrome-devtools` | Inspecting the running app |

Two of them read API keys from your shell environment, not from `.env.local`:

```bash
export FIRECRAWL_API_KEY=fc-...
export PERPLEXITY_API_KEY=pplx-...
```

Put those in your shell profile. They are only for local development — the
deployed app does not use them, so do not add them in Vercel. The other two
servers need no key.

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
