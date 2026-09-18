# Working on this project

## Who this is for

The owner of this project is **not a programmer**. He is a creator running
three TikTok accounts. He can follow instructions and click buttons, but he
does not know what a branch, a commit, a build, an environment variable or a
terminal command is, and he should not have to.

## How to write instructions for him — every time, no exceptions

This is the rule that matters most in this file. Instructions that assume
technical knowledge are useless to him and have wasted his time repeatedly.

**Do this:**

- One action per numbered step. Never two things in one step.
- Say exactly where to click, in order, naming the words he will see on screen:
  "Click **Settings** along the top", not "in your project settings".
- Quote on-screen labels in bold so he can visually match them.
- After a step that changes something, say what he should see so he knows it
  worked.
- Give the whole path from where he is now, not from where a developer would
  already be.
- When something must be typed or pasted, put it in its own block, alone, with
  nothing else to copy by accident.
- Put the reason *after* the steps, or leave it out. He wants to do the thing.

**Never do this:**

- Jargon with no explanation: commit, branch, deploy, build, environment
  variable, redeploy, SHA, repo, merge, CLI, terminal.
- "Just" anything. Nothing is just anything.
- Steps that assume he already has a screen open.
- A wall of prose with the actions buried inside it.
- Offering three options when one is right. Pick the best one and say so.

**Before sending any instructions, reread them as someone who has never seen
the tool.** If a step could not be followed by someone looking at the screen
for the first time, rewrite it.

**Prefer doing it over explaining it.** If the task can be done from here
instead, do that and tell him it is done. Instructions are the fallback, not
the default.

## What this app is

Three TikTok accounts, one app. Each account shows ten video ideas that each
come with a full script. Crossing one off draws a replacement. Uploading a
recording auto-edits it and writes the caption.

- `lib/playbook.ts` — researched rules about what works on TikTok, sent with
  every generation. `docs/research.md` explains where it came from.
- `db/channels.ts` — the three channel profiles. These drive everything the
  app writes; treat them as the product.
- `lib/pool.ts` — keeps ten scripted ideas per account.
- `lib/video/` — transcribe, plan the cuts, render. `plan.ts` is pure and
  unit tested (`npm test`); the caption timing maths lives there.

## Conventions

- Run `npm run typecheck`, `npm run build` and `npm test` before pushing.
- Changing `db/schema.ts` means running `npm run db:generate`, which rewrites
  both the migration and `db/bootstrap.ts`.
- Correcting a shipped channel profile means adding the old mission to
  `SUPERSEDED_MISSIONS` in `db/channels.ts`, or the fix never reaches the live
  database.
- Never commit secrets. Keys are read from the environment.
