"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  recordSoloMatch,
  type SoloAnswerInput,
  type SoloResult,
} from "@/lib/actions/game";
import { pointsForQuestion, SECONDS_PER_QUESTION } from "@/lib/scoring";
import { orderedIndices } from "@/lib/shuffle";
import type { Question, Topic } from "@/lib/types";

const REVEAL_MS = 1400;

type Phase = "intro" | "playing" | "submitting" | "finished";

export function SoloGame({
  topic,
  questions,
}: {
  topic: Topic;
  questions: Question[];
}) {
  const router = useRouter();
  const total = questions.length;

  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [result, setResult] = useState<SoloResult | null>(null);

  const answersRef = useRef<SoloAnswerInput[]>([]);
  const lockedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = questions[idx];

  const liveScore = answersRef.current.reduce((sum, a, i) => {
    const correct = a.selectedIndex === questions[i]?.correct_index;
    return sum + (correct ? pointsForQuestion(i, total) : 0);
  }, 0);

  const finish = useCallback(async () => {
    setPhase("submitting");
    try {
      const r = await recordSoloMatch(topic.id, answersRef.current);
      setResult(r);
    } catch {
      // Fall back to a locally-computed result if the save fails.
      let score = 0;
      let correctCount = 0;
      answersRef.current.forEach((a, i) => {
        if (a.selectedIndex === questions[i]?.correct_index) {
          score += pointsForQuestion(i, total);
          correctCount += 1;
        }
      });
      const max = questions.reduce((s, _q, i) => s + pointsForQuestion(i, total), 0);
      setResult({ score, max, correctCount, total });
    }
    setPhase("finished");
  }, [questions, topic.id, total]);

  const goNext = useCallback(() => {
    if (idx + 1 >= total) {
      finish();
      return;
    }
    setIdx((i) => i + 1);
    setSelected(null);
    setLocked(false);
    lockedRef.current = false;
    setTimeLeft(SECONDS_PER_QUESTION);
  }, [idx, total, finish]);

  const lockAnswer = useCallback(
    (selIndex: number | null) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      setLocked(true);
      setSelected(selIndex);
      answersRef.current = [
        ...answersRef.current,
        { questionId: current.id, selectedIndex: selIndex },
      ];
      if (intervalRef.current) clearInterval(intervalRef.current);
      advanceRef.current = setTimeout(goNext, REVEAL_MS);
    },
    [current, goNext],
  );

  // Keep a stable ref so the timer effect never resets mid-question.
  const lockAnswerRef = useRef(lockAnswer);
  useEffect(() => {
    lockAnswerRef.current = lockAnswer;
  });

  // Countdown timer, restarted for each question.
  useEffect(() => {
    if (phase !== "playing") return;
    setTimeLeft(SECONDS_PER_QUESTION);
    const start = performance.now();
    intervalRef.current = setInterval(() => {
      const left = Math.max(
        0,
        SECONDS_PER_QUESTION - (performance.now() - start) / 1000,
      );
      setTimeLeft(left);
      if (left <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        lockAnswerRef.current(null);
      }
    }, 100);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, idx]);

  useEffect(() => {
    return () => {
      if (advanceRef.current) clearTimeout(advanceRef.current);
    };
  }, []);

  function start() {
    answersRef.current = [];
    lockedRef.current = false;
    setIdx(0);
    setSelected(null);
    setLocked(false);
    setResult(null);
    setTimeLeft(SECONDS_PER_QUESTION);
    setPhase("playing");
  }

  function playAgain() {
    setPhase("intro");
    router.refresh(); // reshuffle questions from the server
  }

  // ---- Intro screen ----
  if (phase === "intro") {
    return (
      <Shell>
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
              {total} questions · {SECONDS_PER_QUESTION}s each · last one is
              worth double
            </p>
          </div>
          <button
            onClick={start}
            className="w-full rounded-xl bg-brand-600 px-4 py-4 text-lg font-bold text-white transition hover:bg-brand-700"
          >
            Start practice
          </button>
          <Link href="/topics" className="text-sm text-neutral-500 hover:underline">
            ← Choose another topic
          </Link>
        </div>
      </Shell>
    );
  }

  // ---- Result screen ----
  if (phase === "finished" && result) {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
            {topic.name}
          </p>
          <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full border-8 border-brand-600">
            <span className="text-5xl font-extrabold text-brand-600">
              {result.score}
            </span>
            <span className="text-sm text-neutral-500">/ {result.max} pts</span>
          </div>
          <p className="text-lg">
            <strong>{result.correctCount}</strong> of {result.total} correct
          </p>
          <div className="flex w-full flex-col gap-2">
            <button
              onClick={playAgain}
              className="w-full rounded-xl bg-brand-600 px-4 py-3 font-bold text-white transition hover:bg-brand-700"
            >
              Play again
            </button>
            <Link
              href="/topics"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-center font-semibold text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
            >
              Back to topics
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  // ---- Submitting ----
  if (phase === "submitting") {
    return (
      <Shell>
        <div className="flex flex-1 items-center justify-center text-neutral-500">
          Saving your score…
        </div>
      </Shell>
    );
  }

  // ---- Playing ----
  const isLast = idx === total - 1;
  const timePct = (timeLeft / SECONDS_PER_QUESTION) * 100;

  return (
    <Shell>
      <div className="flex items-center justify-between text-sm font-semibold">
        <span className="text-neutral-500">
          Question {idx + 1}/{total}
        </span>
        <span className="text-brand-600">{liveScore} pts</span>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-full rounded-full bg-brand-600 transition-[width] duration-100 ease-linear"
          style={{ width: `${timePct}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col justify-center gap-6 py-6">
        <div className="text-center">
          {isLast && (
            <span className="mb-2 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              Double points!
            </span>
          )}
          <h2 className="text-xl font-bold leading-snug">{current.text}</h2>
        </div>

        {current.image_url && (
          <div className="relative mx-auto h-44 w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
            <Image
              src={current.image_url}
              alt=""
              fill
              unoptimized
              className="object-contain"
            />
          </div>
        )}

        <div className="grid gap-3">
          {orderedIndices(current.answers.length, current.id).map(
            (originalIndex, j) => {
              let cls =
                "border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900";
              if (locked) {
                if (originalIndex === current.correct_index) {
                  cls = "border-green-500 bg-green-50 dark:bg-green-950/50";
                } else if (originalIndex === selected) {
                  cls = "border-brand-500 bg-brand-50 dark:bg-brand-950/50";
                } else {
                  cls = "border-neutral-200 opacity-60 dark:border-neutral-800";
                }
              }
              return (
                <button
                  key={j}
                  disabled={locked}
                  onClick={() => lockAnswer(originalIndex)}
                  className={`rounded-xl border-2 px-4 py-4 text-left text-base font-medium transition ${cls}`}
                >
                  {current.answers[originalIndex]}
                </button>
              );
            },
          )}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-6">
      {children}
    </main>
  );
}
