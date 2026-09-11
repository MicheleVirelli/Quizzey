"use client";

import { useActionState } from "react";
import { COUNTRIES } from "@/lib/countries";
import type { ProfileState } from "@/lib/actions/profile";

export function ProfileForm({
  action,
  submitLabel,
  initial,
}: {
  action: (state: ProfileState, formData: FormData) => Promise<ProfileState>;
  submitLabel: string;
  initial?: {
    username?: string;
    display_name?: string | null;
    country?: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(action, {});
  // Don't prefill the auto-generated "player_..." placeholder username.
  const initialUsername = initial?.username?.startsWith("player_")
    ? ""
    : (initial?.username ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Username
        <input
          name="username"
          required
          defaultValue={initialUsername}
          placeholder="quizmaster"
          className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <span className="text-xs text-neutral-400">
          3–20 letters, numbers or underscores.
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Display name
        <input
          name="display_name"
          defaultValue={initial?.display_name ?? ""}
          placeholder="How your name shows up"
          className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Country
        <select
          name="country"
          defaultValue={initial?.country ?? ""}
          className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="" disabled>
            Pick your country…
          </option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
      </label>

      {state.error && <p className="text-sm text-brand-600">{state.error}</p>}
      {state.message && <p className="text-sm text-green-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
