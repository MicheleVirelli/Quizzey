"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { joinQueue, leaveQueue } from "@/lib/actions/matchmaking";
import type { Topic } from "@/lib/types";

export function Matchmaking({
  topic,
  onCancel,
}: {
  topic: Topic;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      if (cancelled || doneRef.current) return;
      try {
        const res = await joinQueue(topic.id);
        if (cancelled) return;
        if (res.error) {
          setError(res.error);
          return;
        }
        if (res.matchId) {
          doneRef.current = true;
          router.push(`/match/${res.matchId}`);
          return;
        }
      } catch {
        // transient — keep polling
      }
    };

    poll();
    const pollTimer = setInterval(poll, 1500);
    const clock = setInterval(() => setElapsed((e) => e + 1), 1000);

    return () => {
      cancelled = true;
      clearInterval(pollTimer);
      clearInterval(clock);
      // Leave the queue if we're navigating away without a match.
      if (!doneRef.current) void leaveQueue();
    };
  }, [topic.id, router]);

  async function cancel() {
    doneRef.current = true;
    await leaveQueue();
    onCancel();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      {error ? (
        <>
          <p className="text-lg font-semibold text-brand-600">{error}</p>
          <button
            onClick={onCancel}
            className="rounded-xl border border-neutral-300 px-5 py-3 font-semibold dark:border-neutral-700"
          >
            Back
          </button>
        </>
      ) : (
        <>
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-600 dark:border-neutral-800 dark:border-t-brand-500" />
          <div>
            <h1 className="text-xl font-extrabold">Finding an opponent…</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {topic.icon} {topic.name} · {elapsed}s
            </p>
          </div>
          <p className="max-w-xs text-xs text-neutral-400">
            Both players need to be searching this topic at the same time. Open
            the app on a second account to test a match.
          </p>
          <button
            onClick={cancel}
            className="rounded-xl border border-neutral-300 px-5 py-3 font-semibold text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
          >
            Cancel
          </button>
        </>
      )}
    </main>
  );
}
