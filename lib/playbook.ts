/**
 * What actually works on TikTok, as of the 2026 research pass. This is sent
 * with every generation request, so a script is written against real retention
 * mechanics rather than generic "make it engaging" advice.
 *
 * Sources are listed in docs/research.md. Revisit when the platform shifts —
 * the follower-first change below landed in 2026 and rewrote a lot of advice.
 */
export const CRAFT_PLAYBOOK = `
HOW THIS PLATFORM ACTUALLY WORKS (2026)

The first three seconds decide everything.
- About 71% of viewers decide whether to keep watching within 3 seconds, and a video needs roughly 70% retention at that mark to get pushed further.
- The opening must be a pattern interrupt, not a greeting. No "hey guys", no "in this video", no throat-clearing, no logo, no slow build.
- The very first frame needs movement, a face mid-expression, or high contrast. A static neutral shot loses before a word lands.
- Write the hook as a complete spoken sentence. It is the single highest-leverage line in the script.

Completion beats length.
- A 30-second video watched to 80% outperforms a 60-second video watched to 40%. Never pad.
- Cut the video at the point the idea is finished, even if that is 18 seconds.
- Watch time and completion rate together are the heaviest ranking signal, roughly 40-50% of the weight.

Rewatches are the 2026 cheat code.
- Loop and rewatch rate is now a priority signal, and the platform tracks rewatches of specific segments.
- End on a callback to the opening frame, an unfinished beat, or a detail that only makes sense on a second viewing. Design the last line to send the viewer back to the first.

Shares and saves outrank likes.
- A share to DMs is worth roughly 3x a like. Saves are a strong intent signal.
- Ask yourself who the viewer would send this to, and make that person obvious in the content.
- This is why a script with one genuinely useful or genuinely absurd specific outperforms a general take.

The middle is where videos die.
- Drop-off spikes around 10-15 seconds. Put a pattern interrupt there: a hard cut, a location or framing change, a new on-screen text treatment, a tone shift.
- Aim for 3-5 interrupts across the video, roughly one every 3-5 seconds. Mark them in the script.
- Trim every piece of dead air between beats.

Cold start, and the 2026 follower-first change.
- New videos are now shown to existing followers first, and only pushed to non-followers if completion, shares and saves hold up.
- The first cohort is small — a few hundred viewers over the first 30-90 minutes. Roughly 35% completion plus about 1.5% meaningful engagement is what graduates a video.
- Practically: write for the people who already follow this account, not for a hypothetical mass audience.

SCRIPT SHAPE
- Hook (0-3s): one sentence, pattern interrupt, written word for word.
- Body: 3-4 short punchy segments, each one idea, each ending on a reason to stay.
- Interrupts: marked in the script where the visual or tone changes.
- Close: a callback or open loop that earns a rewatch, or a genuine CTA — never both.

HOW IT SHOULD BE SHOT
- Vertical 9:16, 1080x1920, 30fps. Use 60fps only when there is real motion and strong light.
- Phone at eye level on a tripod, face toward a window. Lighting and framing matter more than the camera.
- Audio is less forgiving than image. Get the mic close; viewers tolerate a soft picture but not echo, wind or uneven levels.
- Clean the lens. Keep framing consistent between takes so cuts are invisible.
`.trim();

/** Shown in the app next to the scripts, so the guidance is where the work happens. */
export const RECORDING_TIPS = [
  {
    title: "Face a window, phone at eye level",
    body: "Natural light in front of you beats any ring light behind you. Eye level reads as conversation; below reads as an interrogation.",
  },
  {
    title: "Get the mic close",
    body: "Viewers forgive a soft picture and abandon bad audio. A cheap wired mic near your mouth beats your phone across the room.",
  },
  {
    title: "Tripod, and don't move it",
    body: "Consistent framing between takes is what makes cuts invisible. Handheld drift is the most common reason an edit looks amateur.",
  },
  {
    title: "Shoot the hook three times",
    body: "The first three seconds decide the video. Do the opening line three ways and keep the one with the most energy.",
  },
  {
    title: "Vertical, 1080x1920, 30fps",
    body: "Lock it in your camera settings once. 60fps only when something is genuinely moving fast and the light is strong.",
  },
  {
    title: "Leave a beat of silence between segments",
    body: "It gives the editor a clean cut point. The app removes the dead air automatically, but it needs somewhere to cut.",
  },
];
