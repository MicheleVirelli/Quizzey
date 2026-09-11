"use client";

import { useActionState } from "react";
import { createTopic, type ContentState } from "@/lib/actions/content";

const COLORS = ["#e11d48", "#be123c", "#f43f5e", "#9f1239", "#7c3aed", "#0ea5e9", "#059669", "#d97706"];

export function CreateTopicForm() {
  const [state, formAction, pending] = useActionState<ContentState, FormData>(
    createTopic,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Topic name
        <input
          name="name"
          required
          placeholder="e.g. Culture of Istanbul"
          className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Description
        <input
          name="description"
          placeholder="What is this topic about?"
          className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Category
          <input
            name="category"
            placeholder="e.g. Places"
            className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Emoji
          <input
            name="icon"
            maxLength={4}
            defaultValue="❓"
            className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-center text-2xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
      </div>

      <fieldset className="flex flex-col gap-2 text-sm font-medium">
        Colour
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c, i) => (
            <label key={c} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={c}
                defaultChecked={i === 0}
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

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create & add questions"}
      </button>
    </form>
  );
}
