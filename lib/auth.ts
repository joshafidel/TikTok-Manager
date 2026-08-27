/**
 * Single-user password gate. Uses Web Crypto so the same code runs in
 * middleware (edge runtime) and in server actions (node).
 *
 * The app password doubles as the signing secret — one env var to set, one
 * thing to get wrong. Fine for a single-operator tool; do not reuse this
 * pattern for anything multi-user.
 */

export const SESSION_COOKIE = "tm_session";
const SESSION_DAYS = 30;

const encoder = new TextEncoder();

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Length-safe comparison so a wrong password can't be timed out character by character. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function checkPassword(secret: string, attempt: string): Promise<boolean> {
  // Web Crypto rejects a zero-length HMAC key, so an empty submission would
  // throw rather than simply fail. Refuse it before it reaches importKey.
  if (!secret || !attempt) return false;
  // Compare digests rather than raw strings so length isn't leaked either.
  const [x, y] = await Promise.all([hmac(secret, "pw"), hmac(attempt, "pw")]);
  return safeEqual(x, y);
}

export async function createSessionToken(secret: string): Promise<string> {
  if (!secret) throw new Error("Cannot mint a session without a password set.");
  const exp = String(Date.now() + SESSION_DAYS * 86_400_000);
  return `${exp}.${await hmac(secret, exp)}`;
}

export async function verifySessionToken(
  secret: string,
  token: string | undefined,
): Promise<boolean> {
  if (!secret || !token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;

  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;

  return safeEqual(sig, await hmac(secret, exp));
}

export const SESSION_MAX_AGE = SESSION_DAYS * 86_400;
