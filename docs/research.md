# What the scripts are built on

`lib/playbook.ts` is sent with every generation request. It is not general
advice — it is a condensed version of the research below, so scripts are written
against how the platform actually distributes video rather than against vibes.

Researched September 2026. Worth revisiting roughly every six months; the
follower-first change below rewrote a lot of older advice.

## The findings that shaped the playbook

**The first three seconds.** Around 71% of viewers decide whether to keep
watching within three seconds, and roughly 70% retention at that mark is the
threshold for wider distribution. Movement, a face mid-expression, or high
contrast in the very first frame measurably beats a static neutral opener.

**Completion beats length.** A 30-second video watched to 80% outperforms a
60-second video watched to 40%. Watch time and completion together are the
heaviest signal, around 40-50% of the weight. This is why the script schema
asks for an honest runtime estimate and the prompt forbids padding.

**Rewatches are the 2026 lever.** Loop and rewatch rate became a priority
signal, with per-segment rewatch tracking added mid-2026. This is why every
script carries a `loopLine` written to send the viewer back to the opening.

**Shares and saves outrank likes.** A share to DMs is weighted roughly 3x a
like. Saves are a strong intent signal.

**The middle is where videos die.** Drop-off spikes around 10-15 seconds.
Three to five pattern interrupts, roughly one every 3-5 seconds, is the
guidance the prompt encodes as inline `[INTERRUPT: ...]` marks.

**Follower-first distribution.** New videos are shown to existing followers
before non-followers, and only graduate if completion, shares and saves hold
up. Practically this means writing for the people who already follow the
account.

**Recording.** Audio is less forgiving than image. Vertical 9:16 at 1080x1920,
30fps, phone at eye level facing a window, on a tripod. Lighting, framing and
clean audio matter more than the camera.

## Sources

- [TikTok's 3-second rule and retention thresholds](https://www.teleprompter.com/blog/tiktok-3-second-rule)
- [Retention benchmarks by video length](https://retensis.com/blog/tiktok-retention-rate-benchmarks-2026)
- [How the TikTok algorithm works in 2026](https://blog.hootsuite.com/tiktok-algorithm/)
- [Ranking signals, rewatches and micro-loop tracking](https://www.darkroomagency.com/observatory/how-tiktok%E2%80%99s-algorithm-works-in-2026-and-15-tactics-to-go-viral)
- [Watch time and completion weighting](https://www.go-viral.app/blog/tiktok-algorithm-2026/)
- [Pattern interrupts and mid-video retention](https://edicionvideopro.com/en/editing-for-platforms-video-marketing/pattern-interrupts-tiktok-retention-guide/)
- [Script structure and pacing](https://teleprompter.works/blog/tiktok-script-guide/)
- [Recording setup: lighting, audio, framing](https://www.buyzivo.com/best-mobile-accessories-for-tiktok/)
