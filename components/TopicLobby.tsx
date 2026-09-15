"use client";

import Link from "next/link";
import { useState } from "react";
import { Matchmaking } from "@/components/Matchmaking";
import { SoloGame } from "@/components/SoloGame";
import { SECONDS_PER_QUESTION } from "@/lib/scoring";
import type { Question, Topic } from "@/lib/types";

type Mode = "menu" | "solo" | "versus";

export function TopicLobby({
  topic,
  soloQuestions,
  canManage,
}: {
  topic: Topic;
  soloQuestions: Question[];
  canManage?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("menu");

  if (mode === "solo") {
    return <SoloGame topic={topic} questions={soloQuestions} />;
  }
  if (mode === "versus") {
    return <Matchmaking topic={topic} onCancel={() => setMode("menu")} />;
  }

  const noQuestions = soloQuestions.length === 0;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-6">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-3xl text-5xl"
          style={{ backgroundColor: topic.color ?? "#e11d48" }}
        >
          {topic.icon ?? "❓"}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">{topic.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {soloQuestions.length} questions · {SECONDS_PER_QUESTION}s each ·
            last one is worth double
          </p>
        </div>

        {noQuestions ? (
          <p className="rounded-xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700">
            This topic has no questions yet.
          </p>
        ) : (
          <div className="flex w-full flex-col gap-3">
            <button
              onClick={() => setMode("versus")}
              className="rounded-xl bg-brand-600 px-4 py-4 text-lg font-bold text-white transition hover:bg-brand-700"
            >
              ⚔️ Play 1v1
            </button>
            <button
              onClick={() => setMode("solo")}
              className="rounded-xl border border-neutral-300 px-4 py-4 text-lg font-semibold text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
            >
              🧠 Practice solo
            </button>
          </div>
        )}

        {canManage && (
          <Link
            href={`/create/${topic.id}`}
            className="text-sm font-semibold text-brand-600 hover:underline"
          >
            ✏️ Edit topic
          </Link>
        )}

        <Link href="/topics" className="text-sm text-neutral-500 hover:underline">
          ← Choose another topic
        </Link>
      </div>
    </main>
  );
}
