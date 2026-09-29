import "server-only";
import type { EditPlan } from "@/db/schema";
import { buildEdit } from "./edit-doc";

/**
 * Shotstack render. Isolated here so swapping providers touches one file —
 * everything upstream deals in EditPlan, not in any vendor's JSON.
 */
const STAGE = "https://api.shotstack.io/edit/stage";
const PROD = "https://api.shotstack.io/edit/v1";

/**
 * Shotstack issues two separate keys — one for the sandbox, one for production —
 * and each is rejected by the other's endpoint. Rather than make someone work
 * out which one they copied, try both once and remember which accepted it.
 */
let resolved: string | null = null;

async function accepts(url: string, apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/templates`, {
      headers: { "x-api-key": apiKey },
      signal: AbortSignal.timeout(10_000),
    });
    return res.status !== 401 && res.status !== 403;
  } catch {
    return false;
  }
}

export async function base(): Promise<string> {
  // An explicit setting wins; nothing to detect.
  if (process.env.SHOTSTACK_ENV === "production") return PROD;
  if (process.env.SHOTSTACK_ENV === "stage") return STAGE;

  if (resolved) return resolved;

  const apiKey = key();
  // Sandbox first: free and watermarked, the safer default to land on.
  if (await accepts(STAGE, apiKey)) return (resolved = STAGE);
  if (await accepts(PROD, apiKey)) return (resolved = PROD);

  throw new Error(
    "Shotstack rejected this key on both the sandbox and production endpoints. " +
      "Copy a fresh key from the Shotstack dashboard.",
  );
}

function key(): string {
  const k = process.env.SHOTSTACK_API_KEY;
  if (!k) throw new Error("SHOTSTACK_API_KEY is not set — rendering is unavailable.");
  return k;
}

export async function submitRender(sourceUrl: string, plan: EditPlan): Promise<string> {
  const res = await fetch(`${await base()}/render`, {
    method: "POST",
    headers: { "x-api-key": key(), "content-type": "application/json" },
    body: JSON.stringify(buildEdit(sourceUrl, plan)),
  });

  if (!res.ok) throw new Error(`Render request rejected (${res.status}): ${await res.text()}`);

  const data = (await res.json()) as { response?: { id?: string } };
  const id = data.response?.id;
  if (!id) throw new Error("Render accepted but returned no job id.");
  return id;
}

export type RenderState = { status: string; url?: string; error?: string };

export async function checkRender(renderId: string): Promise<RenderState> {
  const res = await fetch(`${await base()}/render/${renderId}`, {
    headers: { "x-api-key": key() },
  });
  if (!res.ok) throw new Error(`Render status check failed (${res.status}).`);

  const data = (await res.json()) as {
    response?: { status?: string; url?: string; error?: string };
  };

  return {
    status: data.response?.status ?? "unknown",
    url: data.response?.url,
    error: data.response?.error,
  };
}
