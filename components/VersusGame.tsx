"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createRematch,
  finalizeVersusMatch,
  type VersusResult,
} from "@/lib/actions/versus";
import { pointsForQuestion, SECONDS_PER_QUESTION } from "@/lib/scoring";
import { orderedIndices } from "@/lib/shuffle";
import { createClient } from "@/lib/supabase/client";
import type { Question } from "@/lib/types";

const READY_MS = 4000;
const ANSWER_MS = SECONDS_PER_QUESTION * 1000;
const REVEAL_MS = 2600;
const WINDOW_MS = ANSWER_MS + REVEAL_MS;

type Answer = { display: number | null; correct: boolean; timeMs: number };
type Clock =
  | { kind: "ready"; readyLeft: number }
  | { kind: "play"; index: number; timeLeft: number; reveal: boolean }
  | { kind: "over" };

export function VersusGame({
  matchId,
  currentUserId,
  playerA,
  nameA,
  nameB,
  avatarA,
  avatarB,
  startedAt,
  questions,
  topicName,
}: {
  matchId: string;
  currentUserId: string;
  playerA: string;
  playerB: string | null;
  nameA: string;
  nameB: string;
  avatarA: string | null;
  avatarB: string | null;
  startedAt: string;
  questions: Question[];
  topicName: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const isLeader = currentUserId === playerA;
  const myName = isLeader ? nameA : nameB;
  const oppName = isLeader ? nameB : nameA;
  const myAvatar = isLeader ? avatarA : avatarB;
  const oppAvatar = isLeader ? avatarB : avatarA;
  const total = questions.length;

  const [clock, setClock] = useState<Clock>({ kind: "ready", readyLeft: 3 });
  const [ended, setEnded] = useState(false);
  const [myAnswers, setMyAnswers] = useState<Record<number, Answer>>({});
  const [oppAnswers, setOppAnswers] = useState<Record<number, Answer>>({});
  const [result, setResult] = useState<VersusResult | null>(null);
  const [myRematch, setMyRematch] = useState(false);
  const [oppRematch, setOppRematch] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const offsetRef = useRef(0);
  const questionStartRef = useRef(0);
  const myAnswersRef = useRef<Record<number, Answer>>({});
  const oppAnswersRef = useRef<Record<number, Answer>>({});
  const autoLockedRef = useRef<Set<number>>(new Set());
  const endedRef = useRef(false);
  const finalizeStartedRef = useRef(false);
  const rematchStartedRef = useRef(false);
  const myRematchRef = useRef(false);
  const mountedRef = useRef(true);

  const orderFor = useCallback(
    (index: number) =>
      orderedIndices(
        questions[index].answers.length,
        `${matchId}:${questions[index].id}`,
      ),
    [matchId, questions],
  );

  const lockAnswer = useCallback(
    (displayIndex: number | null, forIndex: number) => {
      if (myAnswersRef.current[forIndex]) return;
      const q = questions[forIndex];
      const original =
        displayIndex === null ? null : orderFor(forIndex)[displayIndex];
      const correct = original !== null && original === q.correct_index;
      const now = Date.now() + offsetRef.current;
      const timeMs =
        displayIndex === null
          ? ANSWER_MS
          : Math.max(0, Math.min(ANSWER_MS, now - questionStartRef.current));

      const ans: Answer = { display: displayIndex, correct, timeMs };
      myAnswersRef.current[forIndex] = ans;
      setMyAnswers((prev) => ({ ...prev, [forIndex]: ans }));

      void supabase.from("match_answers").upsert(
        {
          match_id: matchId,
          user_id: currentUserId,
          question_id: q.id,
          selected_index: original,
          is_correct: correct,
          time_ms: timeMs,
        },
        { onConflict: "match_id,user_id,question_id" },
      );
      void channelRef.current?.send({
        type: "broadcast",
        event: "answer",
        payload: { index: forIndex, playerId: currentUserId, display: displayIndex, correct, timeMs },
      });
    },
    [currentUserId, matchId, orderFor, questions, supabase],
  );

  // Clock: derive question progression from the shared start time so a reload
  // rejoins at the right question instead of breaking the match.
  useEffect(() => {
    const startBase = new Date(startedAt).getTime() + READY_MS;
    const tick = () => {
      const now = Date.now() + offsetRef.current;
      const elapsed = now - startBase;
      if (elapsed < 0) {
        setClock({ kind: "ready", readyLeft: Math.ceil(-elapsed / 1000) });
        return;
      }
      const index = Math.floor(elapsed / WINDOW_MS);
      if (index >= total) {
        setClock({ kind: "over" });
        if (!endedRef.current) {
          endedRef.current = true;
          setEnded(true);
        }
        return;
      }
      const within = elapsed - index * WINDOW_MS;
      const reveal = within >= ANSWER_MS;
      questionStartRef.current = startBase + index * WINDOW_MS;
      if (
        reveal &&
        !myAnswersRef.current[index] &&
        !autoLockedRef.current.has(index)
      ) {
        autoLockedRef.current.add(index);
        lockAnswer(null, index);
      }
      setClock({
        kind: "play",
        index,
        timeLeft: reveal ? 0 : (ANSWER_MS - within) / 1000,
        reveal,
      });
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [startedAt, total, lockAnswer]);

  // Realtime channel + restore any answers already saved (survives reload).
  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      try {
        const { data } = await supabase.rpc("now_ms");
        if (typeof data === "number") offsetRef.current = data - Date.now();
      } catch {
        // no server clock — local time is fine when devices are in sync
      }
      const { data: rows } = await supabase
        .from("match_answers")
        .select("user_id, question_id, selected_index, is_correct, time_ms")
        .eq("match_id", matchId);
      if (rows && mountedRef.current) {
        const posById = new Map(questions.map((q, i) => [q.id, i]));
        const mine: Record<number, Answer> = {};
        const opp: Record<number, Answer> = {};
        for (const r of rows) {
          const idx = posById.get(r.question_id as string);
          if (idx == null) continue;
          const original = r.selected_index as number | null;
          const display =
            original === null ? null : orderFor(idx).indexOf(original);
          const a: Answer = {
            display,
            correct: r.is_correct as boolean,
            timeMs: (r.time_ms as number | null) ?? ANSWER_MS,
          };
          if (r.user_id === currentUserId) mine[idx] = a;
          else opp[idx] = a;
        }
        myAnswersRef.current = mine;
        oppAnswersRef.current = opp;
        setMyAnswers(mine);
        setOppAnswers(opp);
      }
    })();

    const channel = supabase.channel(`match:${matchId}`, {
      config: { broadcast: { self: true } },
    });
    channelRef.current = channel;

    channel.on("broadcast", { event: "answer" }, ({ payload }) => {
      if (!mountedRef.current) return;
      const a: Answer = {
        display: payload.display,
        correct: payload.correct,
        timeMs: payload.timeMs,
      };
      if (payload.playerId === currentUserId) {
        myAnswersRef.current[payload.index] = a;
        setMyAnswers((p) => ({ ...p, [payload.index]: a }));
      } else {
        oppAnswersRef.current[payload.index] = a;
        setOppAnswers((p) => ({ ...p, [payload.index]: a }));
      }
    });
    channel.on("broadcast", { event: "rematch" }, ({ payload }) => {
      if (!mountedRef.current) return;
      if (payload.playerId === currentUserId) setMyRematch(true);
      else {
        setOppRematch(true);
        // Re-announce our own request so both sides converge reliably.
        if (myRematchRef.current) {
          channelRef.current?.send({
            type: "broadcast",
            event: "rematch",
            payload: { playerId: currentUserId },
          });
        }
      }
    });
    channel.on("broadcast", { event: "rematch_go" }, ({ payload }) => {
      router.push(`/match/${payload.matchId}`);
    });

    channel.subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // Finalize from the database once the clock ends (correct even after reloads).
  useEffect(() => {
    if (!ended || finalizeStartedRef.current) return;
    finalizeStartedRef.current = true;
    const t = setTimeout(async () => {
      const res = await finalizeVersusMatch(matchId);
      if (!mountedRef.current) return;
      if (!("error" in res)) setResult(res);
      else
        setTimeout(async () => {
          const r2 = await finalizeVersusMatch(matchId);
          if (mountedRef.current && !("error" in r2)) setResult(r2);
        }, 1500);
    }, 1200);
    return () => clearTimeout(t);
  }, [ended, matchId]);

  // Rematch: host creates the match once both accept.
  useEffect(() => {
    myRematchRef.current = myRematch;
    if (myRematch && oppRematch && isLeader && !rematchStartedRef.current) {
      rematchStartedRef.current = true;
      (async () => {
        const res = await createRematch(matchId);
        if (res.matchId) {
          channelRef.current?.send({
            type: "broadcast",
            event: "rematch_go",
            payload: { matchId: res.matchId },
          });
        }
      })();
    }
  }, [myRematch, oppRematch, isLeader, matchId]);

  // Don't leave the requester stuck if the opponent never accepts.
  useEffect(() => {
    if (!myRematch) return;
    const t = setTimeout(() => {
      if (mountedRef.current) {
        setMyRematch(false);
        setOppRematch(false);
        rematchStartedRef.current = false;
      }
    }, 25000);
    return () => clearTimeout(t);
  }, [myRematch]);

  function requestRematch() {
    setMyRematch(true);
    myRematchRef.current = true;
    channelRef.current?.send({
      type: "broadcast",
      event: "rematch",
      payload: { playerId: currentUserId },
    });
  }

  // ---- Scoring (first correct answer wins the question's points) ----
  const questionWinner = (i: number): { who: "me" | "opp" | null; pts: number } => {
    const mine = myAnswers[i];
    const opp = oppAnswers[i];
    const pts = pointsForQuestion(i, total);
    const myOk = mine?.correct;
    const oppOk = opp?.correct;
    if (myOk && oppOk) return { who: mine.timeMs <= opp.timeMs ? "me" : "opp", pts };
    if (myOk) return { who: "me", pts };
    if (oppOk) return { who: "opp", pts };
    return { who: null, pts };
  };

  const settled = (i: number) => {
    if (clock.kind === "over") return true;
    if (clock.kind !== "play") return false;
    return i < clock.index || (i === clock.index && clock.reveal);
  };

  let myScore = 0;
  let oppScore = 0;
  for (let i = 0; i < total; i++) {
    if (!settled(i)) continue;
    const w = questionWinner(i);
    if (w.who === "me") myScore += w.pts;
    else if (w.who === "opp") oppScore += w.pts;
  }

  // ---- Ready ----
  if (clock.kind === "ready") {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-neutral-500">
            {myName} vs {oppName} · {topicName}
          </p>
          <p className="text-6xl font-extrabold text-brand-600">
            {clock.readyLeft > 0 ? clock.readyLeft : "Go!"}
          </p>
          <p className="text-sm text-neutral-400">Get ready…</p>
        </div>
      </Shell>
    );
  }

  // ---- Finalizing ----
  if (ended && !result) {
    return (
      <Shell>
        <div className="flex flex-1 items-center justify-center text-neutral-500">
          Calculating result…
        </div>
      </Shell>
    );
  }

  // ---- Result ----
  if (ended && result) {
    const finalMy = isLeader ? result.scoreA : result.scoreB;
    const finalOpp = isLeader ? result.scoreB : result.scoreA;
    const iWon = result.winner === currentUserId;
    const tie = result.winner === null;
    const heading = tie ? "It's a tie!" : iWon ? "You won! 🎉" : "You lost";

    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
            {topicName}
          </p>
          <h1 className={`text-3xl font-extrabold ${iWon ? "text-brand-600" : ""}`}>
            {heading}
          </h1>
          <div className="flex items-center gap-6">
            <ScorePill name={myName} score={finalMy} highlight={iWon} />
            <span className="text-neutral-400">vs</span>
            <ScorePill name={oppName} score={finalOpp} highlight={!iWon && !tie} />
          </div>

          <div className="flex w-full flex-col gap-2">
            {myRematch ? (
              <p className="rounded-xl border border-neutral-300 px-4 py-3 text-center text-sm font-semibold text-neutral-500 dark:border-neutral-700">
                Waiting for {oppName} to accept…
              </p>
            ) : (
              <button
                onClick={requestRematch}
                className="w-full rounded-xl bg-brand-600 px-4 py-3 text-center font-bold text-white transition hover:bg-brand-700"
              >
                {oppRematch ? "Accept rematch 🔥" : "Rematch"}
              </button>
            )}
            {oppRematch && !myRematch && (
              <p className="text-center text-xs text-brand-600">
                {oppName} wants a rematch!
              </p>
            )}
            <Link
              href="/topics"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-center font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
            >
              Back to topics
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  // ---- Playing ----
  const index = clock.kind === "play" ? clock.index : 0;
  const reveal = clock.kind === "play" ? clock.reveal : false;
  const timeLeft = clock.kind === "play" ? clock.timeLeft : 0;
  const current = questions[index];
  const isLast = index === total - 1;
  const timePct = (timeLeft / SECONDS_PER_QUESTION) * 100;
  const mine = myAnswers[index];
  const opp = oppAnswers[index];
  const iAnswered = Boolean(mine);
  const showResult = iAnswered || reveal;
  const order = orderFor(index);
  const win = reveal ? questionWinner(index) : null;
  const scorerName = win?.who === "me" ? myName : win?.who === "opp" ? oppName : null;

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

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-full rounded-full bg-brand-600 transition-[width] duration-100 ease-linear"
          style={{ width: `${timePct}%` }}
        />
      </div>

      {/* Point flash */}
      <div className="h-6 text-center">
        {reveal && win && (
          <span
            key={index}
            className={`point-pop inline-block rounded-full px-3 py-0.5 text-sm font-bold ${
              win.who
                ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                : "bg-neutral-100 text-neutral-500 dark:bg-neutral-900"
            }`}
          >
            {win.who ? `+${win.pts} ${scorerName}` : "No point"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center gap-4 py-2">
        <div className="text-center">
          {isLast && (
            <span className="mb-2 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              Double points!
            </span>
          )}
          <h2 className="text-xl font-bold leading-snug">{current.text}</h2>
        </div>

        {current.image_url && (
          <div className="relative mx-auto h-40 w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
            <Image src={current.image_url} alt="" fill unoptimized className="object-contain" />
          </div>
        )}

        <div className="grid gap-3">
          {order.map((originalIndex, j) => {
            let cls =
              "border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900";
            if (showResult) {
              if (reveal && originalIndex === current.correct_index) {
                cls = "border-green-500 bg-green-50 dark:bg-green-950/50";
              } else if (j === mine?.display) {
                cls =
                  reveal && originalIndex !== current.correct_index
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-950/50"
                    : "border-neutral-400 bg-neutral-50 dark:bg-neutral-800";
              } else {
                cls = "border-neutral-200 opacity-60 dark:border-neutral-800";
              }
            }
            return (
              <button
                key={j}
                disabled={iAnswered || reveal}
                onClick={() => lockAnswer(j, index)}
                className={`flex items-center justify-between gap-2 rounded-xl border-2 px-4 py-4 text-left text-base font-medium transition ${cls}`}
              >
                <span>{current.answers[originalIndex]}</span>
                <span className="flex items-center gap-1">
                  {mine?.display === j && <Marker label={myName} avatar={myAvatar} mine />}
                  {showResult && opp?.display === j && (
                    <Marker label={oppName} avatar={oppAvatar} />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}

function Marker({
  label,
  avatar,
  mine,
}: {
  label: string;
  avatar?: string | null;
  mine?: boolean;
}) {
  if (avatar) {
    return (
      <span
        title={label}
        className={`relative h-6 w-6 overflow-hidden rounded-full ring-2 ${
          mine ? "ring-brand-600" : "ring-neutral-500"
        }`}
      >
        <Image src={avatar} alt={label} fill unoptimized className="object-cover" />
      </span>
    );
  }
  return (
    <span
      title={label}
      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
        mine ? "bg-brand-600" : "bg-neutral-700 dark:bg-neutral-500"
      }`}
    >
      {label.charAt(0).toUpperCase()}
    </span>
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
