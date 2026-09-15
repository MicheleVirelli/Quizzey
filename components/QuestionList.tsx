"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteQuestion } from "@/lib/actions/content";

export interface QuestionRow {
  id: string;
  text: string;
}

export function QuestionList({
  topicId,
  questions,
}: {
  topicId: string;
  questions: QuestionRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function remove(id: string) {
    startTransition(async () => {
      await deleteQuestion(id, topicId);
      setConfirmId(null);
      router.refresh();
    });
  }

  if (questions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-400">
        Existing questions ({questions.length})
      </h2>
      <ul className="flex flex-col gap-1">
        {questions.map((q) => (
          <li
            key={q.id}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
          >
            <span className="min-w-0 flex-1 truncate">{q.text}</span>
            {confirmId === q.id ? (
              <button
                onClick={() => remove(q.id)}
                disabled={pending}
                className="shrink-0 rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-bold text-white disabled:opacity-60"
              >
                Delete?
              </button>
            ) : (
              <button
                onClick={() => setConfirmId(q.id)}
                className="shrink-0 rounded-lg border border-neutral-300 px-2 py-1 text-xs font-semibold text-neutral-500 dark:border-neutral-700"
              >
                🗑
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
