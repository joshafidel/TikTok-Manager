"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { type ActionResult, ideaFormAction, scriptFormAction } from "@/lib/actions";

function Submit({ children, idle }: { children?: React.ReactNode; idle: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "Thinking…" : (children ?? idle)}
    </button>
  );
}

function Result({ state }: { state: ActionResult }) {
  if (!state) return null;
  if (state.error)
    return (
      <p className="font-mono text-[0.68rem] leading-relaxed text-[var(--tally)]">{state.error}</p>
    );
  return <p className="font-mono text-[0.68rem] text-[var(--good)]">{state.ok}</p>;
}

export function GenerateIdeas({ channelId }: { channelId: string }) {
  const [state, action] = useActionState<ActionResult, FormData>(ideaFormAction, null);

  return (
    <form action={action} className="card flex flex-col gap-3 p-4">
      <input type="hidden" name="channelId" value={channelId} />
      <div className="grid gap-3 sm:grid-cols-[6rem_1fr]">
        <div className="field">
          <label className="label" htmlFor="count">
            How many
          </label>
          <input
            id="count"
            name="count"
            type="number"
            min={1}
            max={25}
            defaultValue={12}
            className="input"
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="steer">
            Steer this batch (optional)
          </label>
          <input
            id="steer"
            name="steer"
            className="input"
            placeholder="A news peg, a theme, a format to lean on"
          />
        </div>
      </div>
      <p className="font-mono text-[0.62rem] leading-relaxed text-ink3">
        Generate a batch and cull it. Keeping three out of twelve is a good outcome — the rejects
        steer the next batch.
      </p>
      <div className="flex items-center gap-3">
        <Submit idle="Generate ideas" />
        <Result state={state} />
      </div>
    </form>
  );
}

export function GenerateScript({ itemId, hasScript }: { itemId: string; hasScript: boolean }) {
  const [state, action] = useActionState<ActionResult, FormData>(scriptFormAction, null);

  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="id" value={itemId} />
      <Submit idle={hasScript ? "Rewrite with Claude" : "Write it with Claude"} />
      <Result state={state} />
    </form>
  );
}
