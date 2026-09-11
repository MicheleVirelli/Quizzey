"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { finalizeVersusMatch, type VersusResult } from "@/lib/actions/versus";
import { pointsForQuestion, SECONDS_PER_QUESTION } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/client";
import type { Question } from "@/lib/types";

const READY_MS = 3000;
const REVEAL_MS = 2500;

type Phase =
  | "connecting"
  | "waiting"
  | "ready"
  | "question"
  | "reveal"
  | "finalizing"
  | "finished";

type Answer = { selectedIndex: number | null; correct: boolean };

export function VersusGame({
  matchId,
  currentUserId,
  playerA,
  nameA,
  nameB,
  questions,
  topicName,
}: {
  matchId: string;
  currentUserId: string;
  playerA: string;
  playerB: string | null;
  nameA: string;
  nameB: string;
  questions: Question[];
  topicName: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const isLeader = currentUserId === playerA;
  const myName = isLeader ? nameA : nameB;
  const oppName = isLeader ? nameB : nameA;
  const total = questions.length;

  const [phase, setPhase] = useState<Phase>("connecting");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [myAnswers, setMyAnswers] = useState<Record<number, Answer>>({});
  const [oppAnswers, setOppAnswers] = useState<Record<number, Answer>>({});
  const [result, setResult] = useState<VersusResult | null>(null);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lockedRef = useRef(false);
  const indexRef = useRef(0);
  const phaseRef = useRef<Phase>("connecting");
  const startedRef = useRef(false);
  const bothPresentRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const setPhaseSafe = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const finalize = useCallback(async () => {
    setPhaseSafe("finalizing");
    const res = await finalizeVersusMatch(matchId);
    if (!mountedRef.current) return;
    if ("error" in res) {
      // Retry once after a short delay (opponent may still be writing).
      setTimeout(async () => {
        const retry = await finalizeVersusMatch(matchId);
        if (mountedRef.current && !("error" in retry)) setResult(retry);
        if (mountedRef.current) setPhaseSafe("finished");
      }, 1500);
      return;
    }
    setResult(res);
    setPhaseSafe("finished");
  }, [matchId, setPhaseSafe]);

  const lockAnswer = useCallback(
    (i: number | null) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      setLocked(true);
      setSelected(i);
      stopTimer();

      const qi = indexRef.current;
      const q = questions[qi];
      const correct = i !== null && i === q.correct_index;
      setMyAnswers((prev) => ({ ...prev, [qi]: { selectedIndex: i, correct } }));

      // Persist (best effort) and tell the opponent.
      void supabase.from("match_answers").insert({
        match_id: matchId,
        user_id: currentUserId,
        question_id: q.id,
        selected_index: i,
        is_correct: correct,
      });
      void channelRef.current?.send({
        type: "broadcast",
        event: "answer",
        payload: { index: qi, playerId: currentUserId, selectedIndex: i, correct },
      });
    },
    [currentUserId, matchId, questions, stopTimer, supabase],
  );

  const startTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(SECONDS_PER_QUESTION);
    const start = performance.now();
    intervalRef.current = setInterval(() => {
      const left = Math.max(
        0,
        SECONDS_PER_QUESTION - (performance.now() - start) / 1000,
      );
      setTimeLeft(left);
      if (left <= 0) {
        stopTimer();
        if (!lockedRef.current) lockAnswer(null);
      }
    }, 100);
  }, [lockAnswer, stopTimer]);

  // Set up the realtime channel once.
  useEffect(() => {
    mountedRef.current = true;
    const channel = supabase.channel(`match:${matchId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: currentUserId },
      },
    });
    channelRef.current = channel;

    channel.on("broadcast", { event: "ready" }, () => {
      if (mountedRef.current) setPhaseSafe("ready");
    });
    channel.on("broadcast", { event: "q" }, ({ payload }) => {
      const i = payload.index as number;
      indexRef.current = i;
      lockedRef.current = false;
      if (!mountedRef.current) return;
      setIndex(i);
      setSelected(null);
      setLocked(false);
      setPhaseSafe("question");
      startTimer();
    });
    channel.on("broadcast", { event: "reveal" }, () => {
      lockedRef.current = true;
      stopTimer();
      if (mountedRef.current) {
        setLocked(true);
        setPhaseSafe("reveal");
      }
    });
    channel.on("broadcast", { event: "answer" }, ({ payload }) => {
      if (!mountedRef.current) return;
      const a: Answer = {
        selectedIndex: payload.selectedIndex,
        correct: payload.correct,
      };
      if (payload.playerId === currentUserId) {
        setMyAnswers((prev) => ({ ...prev, [payload.index]: a }));
      } else {
        setOppAnswers((prev) => ({ ...prev, [payload.index]: a }));
      }
    });
    channel.on("broadcast", { event: "end" }, () => {
      stopTimer();
      finalize();
    });

    channel.on("presence", { event: "sync" }, () => {
      const count = Object.keys(channel.presenceState()).length;
      const both = count >= 2;
      bothPresentRef.current = both;
      if (both && mountedRef.current && phaseRef.current === "waiting") {
        // stay in waiting until the leader kicks off
      }
      maybeStartAsLeader();
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        if (mountedRef.current && phaseRef.current === "connecting") {
          setPhaseSafe("waiting");
        }
        await channel.track({ userId: currentUserId, name: myName });
      }
    });

    function maybeStartAsLeader() {
      if (!isLeader || startedRef.current || !bothPresentRef.current) return;
      startedRef.current = true;
      void runLeaderLoop();
    }

    async function runLeaderLoop() {
      const send = (event: string, payload: Record<string, unknown> = {}) =>
        channelRef.current?.send({ type: "broadcast", event, payload });
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      send("ready");
      await sleep(READY_MS);
      for (let i = 0; i < total; i++) {
        if (!mountedRef.current) return;
        send("q", { index: i });
        await sleep(SECONDS_PER_QUESTION * 1000);
        if (!mountedRef.current) return;
        send("reveal", { index: i });
        await sleep(REVEAL_MS);
      }
      if (mountedRef.current) send("end");
    }

    return () => {
      mountedRef.current = false;
      stopTimer();
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // ---- Derived scores (opponent correctness only shown after reveal) ----
  const scoreFrom = (map: Record<number, Answer>) => {
    let s = 0;
    for (const [k, v] of Object.entries(map)) {
      const qi = Number(k);
      const settled =
        qi < index || (qi === index && phaseRef.current === "reveal");
      if (settled && v.correct) s += pointsForQuestion(qi, total);
    }
    return s;
  };
  const myScore = scoreFrom(myAnswers);
  const oppScore = scoreFrom(oppAnswers);

  // ---- Waiting / connecting ----
  if (phase === "connecting" || phase === "waiting" || phase === "ready") {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-600 dark:border-neutral-800 dark:border-t-brand-500" />
          <div>
            <h1 className="text-xl font-extrabold">
              {phase === "ready" ? "Get ready!" : "Waiting for opponent…"}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {myName} vs {oppName} · {topicName}
            </p>
          </div>
          {phase !== "ready" && (
            <Link
              href="/topics"
              className="text-sm text-neutral-500 hover:underline"
            >
              Leave
            </Link>
          )}
        </div>
      </Shell>
    );
  }

  // ---- Finalizing ----
  if (phase === "finalizing") {
    return (
      <Shell>
        <div className="flex flex-1 items-center justify-center text-neutral-500">
          Calculating result…
        </div>
      </Shell>
    );
  }

  // ---- Result ----
  if (phase === "finished") {
    const finalMy = result
      ? isLeader
        ? result.scoreA
        : result.scoreB
      : myScore;
    const finalOpp = result
      ? isLeader
        ? result.scoreB
        : result.scoreA
      : oppScore;
    const iWon = result?.winner === currentUserId;
    const tie = result ? result.winner === null : finalMy === finalOpp;
    const heading = tie ? "It's a tie!" : iWon ? "You won! 🎉" : "You lost";

    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
            {topicName}
          </p>
          <h1
            className={`text-3xl font-extrabold ${
              iWon ? "text-brand-600" : ""
            }`}
          >
            {heading}
          </h1>
          <div className="flex items-center gap-6">
            <ScorePill name={myName} score={finalMy} highlight={iWon} />
            <span className="text-neutral-400">vs</span>
            <ScorePill name={oppName} score={finalOpp} highlight={!iWon && !tie} />
          </div>
          <Link
            href="/topics"
            className="w-full rounded-xl bg-brand-600 px-4 py-3 text-center font-bold text-white transition hover:bg-brand-700"
          >
            Back to topics
          </Link>
        </div>
      </Shell>
    );
  }

  // ---- Playing (question / reveal) ----
  const current = questions[index];
  const isLast = index === total - 1;
  const timePct = (timeLeft / SECONDS_PER_QUESTION) * 100;
  const oppAnsweredNow = Boolean(oppAnswers[index]);

  return (
    <Shell>
      <div className="flex items-center justify-between text-sm font-semibold">
        <span className="text-brand-600">
          {myName}: {myScore}
        </span>
        <span className="text-neutral-500">
          {index + 1}/{total}
        </span>
        <span className="text-neutral-500">
          {oppName}: {oppScore}
        </span>
      </div>

      <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            oppAnsweredNow ? "bg-green-500" : "bg-neutral-300 dark:bg-neutral-700"
          }`}
        />
        {oppAnsweredNow ? `${oppName} answered` : `${oppName} is thinking…`}
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

        <div className="grid gap-3">
          {current.answers.map((answer, i) => {
            let cls =
              "border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900";
            if (locked) {
              if (phase === "reveal" && i === current.correct_index) {
                cls = "border-green-500 bg-green-50 dark:bg-green-950/50";
              } else if (i === selected) {
                cls =
                  phase === "reveal" && i !== current.correct_index
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-950/50"
                    : "border-neutral-400 bg-neutral-50 dark:bg-neutral-800";
              } else {
                cls = "border-neutral-200 opacity-60 dark:border-neutral-800";
              }
            }
            return (
              <button
                key={i}
                disabled={locked}
                onClick={() => lockAnswer(i)}
                className={`rounded-xl border-2 px-4 py-4 text-left text-base font-medium transition ${cls}`}
              >
                {answer}
              </button>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}

function ScorePill({
  name,
  score,
  highlight,
}: {
  name: string;
  score: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-full border-4 text-3xl font-extrabold ${
          highlight
            ? "border-brand-600 text-brand-600"
            : "border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
        }`}
      >
        {score}
      </div>
      <span className="max-w-24 truncate text-sm font-medium">{name}</span>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-6">
      {children}
    </main>
  );
}
