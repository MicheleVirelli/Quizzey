"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { addQuestion, type ContentState } from "@/lib/actions/content";
import { QUESTIONS_PER_MATCH } from "@/lib/scoring";

export function AddQuestionForm({
  topicId,
  topicSlug,
  initialCount,
}: {
  topicId: string;
  topicSlug: string;
  initialCount: number;
}) {
  const action = addQuestion.bind(null, topicId);
  const [state, formAction, pending] = useActionState<ContentState, FormData>(
    action,
    {},
  );
  const [count, setCount] = useState(initialCount);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      setCount((c) => c + 1);
      formRef.current?.reset();
      formRef.current?.querySelector<HTMLInputElement>("#q-text")?.focus();
    }
  }, [state]);

  const enough = count >= QUESTIONS_PER_MATCH;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-neutral-100 px-4 py-3 text-sm dark:bg-neutral-900">
        <strong>{count}</strong> question{count === 1 ? "" : "s"} added.{" "}
        {enough
          ? "Ready for a full match! 🎉"
          : `Add ${QUESTIONS_PER_MATCH - count} more for a full 10-question match.`}
      </div>

      <form ref={formRef} action={formAction} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Question
          <input
            id="q-text"
            name="text"
            required
            placeholder="What is the capital of Turkey?"
            className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Image <span className="font-normal text-neutral-400">(optional)</span>
          <input
            type="file"
            name="image"
            accept="image/*"
            className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:font-semibold file:text-white dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <p className="text-sm font-medium">Answers (tap the circle to mark the correct one)</p>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <input
              type="radio"
              name="correct_index"
              value={i}
              defaultChecked={i === 0}
              aria-label={`Answer ${i + 1} is correct`}
              className="h-5 w-5 accent-brand-600"
            />
            <input
              name={`answer${i}`}
              required
              placeholder={`Answer ${i + 1}`}
              className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
        ))}

        {state.error && <p className="text-sm text-brand-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add question"}
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {count > 0 && (
          <Link
            href={`/play/${topicSlug}`}
            className="rounded-xl border border-neutral-300 px-4 py-3 text-center font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
          >
            Play this topic
          </Link>
        )}
        <Link
          href="/topics"
          className="text-center text-sm text-neutral-500 hover:underline"
        >
          Done — back to topics
        </Link>
      </div>
    </div>
  );
}
