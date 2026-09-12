"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createChallenge } from "@/lib/actions/challenges";
import type { Topic } from "@/lib/types";

export function ChallengeForm({
  opponentId,
  opponentName,
  topics,
}: {
  opponentId: string;
  opponentName: string;
  topics: Topic[];
}) {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function send(topicId: string) {
    setError(null);
    startTransition(async () => {
      const res = await createChallenge(opponentId, topicId);
      if (res.error) setError(res.error);
      else setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="text-5xl">📨</p>
        <h2 className="text-xl font-bold">Challenge sent to {opponentName}!</h2>
        <p className="max-w-xs text-sm text-neutral-500">
          They&apos;ll see it in their Feed. When they accept, you&apos;ll get a
          &quot;Join&quot; button there too.
        </p>
        <Link
          href="/feed"
          className="rounded-xl bg-brand-600 px-5 py-3 font-bold text-white"
        >
          Go to Feed
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-neutral-500">
        Pick a topic to challenge <strong>{opponentName}</strong>:
      </p>
      {error && <p className="text-sm text-brand-600">{error}</p>}
      <ul className="grid grid-cols-2 gap-3">
        {topics.map((t) => (
          <li key={t.id}>
            <button
              onClick={() => send(t.id)}
              disabled={pending}
              className="flex h-full w-full flex-col gap-1 rounded-2xl border border-neutral-200 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60 dark:border-neutral-800"
              style={{ borderTopColor: t.color ?? "#e11d48", borderTopWidth: 4 }}
            >
              <span className="text-3xl">{t.icon ?? "❓"}</span>
              <span className="font-semibold leading-tight">{t.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
