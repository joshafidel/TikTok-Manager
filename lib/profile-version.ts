import { createHash } from "node:crypto";
import type { Channel } from "@/db/schema";

/**
 * A fingerprint of everything that shapes what this channel produces.
 *
 * Ideas are stamped with it when written. If the profile later changes, the
 * fingerprint changes, and every idea carrying the old one was written to rules
 * that no longer apply — which is exactly the state that used to persist
 * silently, leaving old work on screen after the instructions had moved on.
 */
export function profileVersion(channel: Channel): string {
  const shaping = JSON.stringify([
    channel.mission,
    channel.audience,
    channel.voice,
    channel.formats,
    channel.neverDo,
    channel.styleNotes,
    channel.productNotes,
    channel.cta,
    channel.mode,
    channel.scriptStyle,
    channel.newsDriven,
  ]);
  return createHash("sha256").update(shaping).digest("hex").slice(0, 12);
}
