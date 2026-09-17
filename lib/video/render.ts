import "server-only";
import type { EditPlan } from "@/db/schema";
import { buildEdit } from "./edit-doc";

/**
 * Shotstack render. Isolated here so swapping providers touches one file —
 * everything upstream deals in EditPlan, not in any vendor's JSON.
 */
const STAGE = "https://api.shotstack.io/edit/stage";
const PROD = "https://api.shotstack.io/edit/v1";

function base(): string {
  // Sandbox renders are free and watermarked — the right default until the
  // pipeline has been proven on real footage.
  return process.env.SHOTSTACK_ENV === "production" ? PROD : STAGE;
}

function key(): string {
  const k = process.env.SHOTSTACK_API_KEY;
  if (!k) throw new Error("SHOTSTACK_API_KEY is not set — rendering is unavailable.");
  return k;
}

export async function submitRender(sourceUrl: string, plan: EditPlan): Promise<string> {
  const res = await fetch(`${base()}/render`, {
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
  const res = await fetch(`${base()}/render/${renderId}`, { headers: { "x-api-key": key() } });
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
