"use client";

import { useActionState } from "react";
import { updateTopic, type ContentState } from "@/lib/actions/content";
import type { Topic } from "@/lib/types";

const BASE_COLORS = [
  "#e11d48", "#be123c", "#f43f5e", "#9f1239", "#7c3aed", "#0ea5e9", "#059669", "#d97706",
];

export function EditTopicForm({ topic }: { topic: Topic }) {
  const action = updateTopic.bind(null, topic.id);
  const [state, formAction, pending] = useActionState<ContentState, FormData>(
    action,
    {},
  );

  const current = topic.color ?? BASE_COLORS[0];
  const colors = BASE_COLORS.includes(current)
    ? BASE_COLORS
    : [current, ...BASE_COLORS];

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Topic name
        <input
          name="name"
          required
          defaultValue={topic.name}
          className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Description
        <input
          name="description"
          defaultValue={topic.description ?? ""}
          className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Category
          <input
            name="category"
            defaultValue={topic.category ?? ""}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Emoji
          <input
            name="icon"
            maxLength={4}
            defaultValue={topic.icon ?? "❓"}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-center text-2xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
      </div>

      <fieldset className="flex flex-col gap-2 text-sm font-medium">
        Colour
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <label key={c} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={c}
                defaultChecked={c === current}
                className="peer sr-only"
              />
              <span
                className="block h-9 w-9 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-neutral-900 dark:peer-checked:ring-white"
                style={{ backgroundColor: c }}
              />
            </label>
          ))}
        </div>
      </fieldset>

      {state.error && <p className="text-sm text-brand-600">{state.error}</p>}
      {state.message && <p className="text-sm text-green-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save topic"}
      </button>
    </form>
  );
}
