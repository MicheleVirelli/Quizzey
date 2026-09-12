"use server";

import { createClient } from "@/lib/supabase/server";
import { outcome, pointsForQuestion, QUESTIONS_PER_MATCH } from "@/lib/scoring";

export interface VersusResult {
  scoreA: number;
  scoreB: number;
  winner: string | null;
  playerA: string;
  playerB: string | null;
}

/**
 * Compute the final scores of a 1v1 match from the persisted answers and mark
 * it finished (which fires the per-player stats trigger). The first player to
 * answer a question correctly (smallest time_ms) wins its points.
 *
 * Reads from the database, so it is correct even if a player reloaded during
 * the match. Safe to call by either player and more than once.
 */
export async function finalizeVersusMatch(
  matchId: string,
): Promise<VersusResult | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const { data: match, error: mErr } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();
  if (mErr || !match) return { error: "Match not found." };
  if (match.player_a !== user.id && match.player_b !== user.id) {
    return { error: "Not your match." };
  }

  if (match.status === "finished") {
    return {
      scoreA: match.score_a,
      scoreB: match.score_b,
      winner: match.winner,
      playerA: match.player_a,
      playerB: match.player_b,
    };
  }

  const questionIds = match.question_ids as string[];
  const posById = new Map(questionIds.map((id, i) => [id, i]));

  const { data: answers } = await supabase
    .from("match_answers")
    .select("user_id, question_id, is_correct, time_ms")
    .eq("match_id", matchId);

  type Best = { userId: string; timeMs: number };
  const bestByQuestion = new Map<string, Best>();
  for (const a of answers ?? []) {
    if (!a.is_correct) continue;
    const qid = a.question_id as string;
    const t = (a.time_ms as number | null) ?? Number.MAX_SAFE_INTEGER;
    const cur = bestByQuestion.get(qid);
    if (!cur || t < cur.timeMs) {
      bestByQuestion.set(qid, { userId: a.user_id as string, timeMs: t });
    }
  }

  let scoreA = 0;
  let scoreB = 0;
  for (const [qid, best] of bestByQuestion) {
    const pos = posById.get(qid);
    if (pos == null) continue;
    const pts = pointsForQuestion(pos, questionIds.length);
    if (best.userId === match.player_a) scoreA += pts;
    else if (best.userId === match.player_b) scoreB += pts;
  }

  const code = outcome(scoreA, scoreB);
  const winner =
    code === "a" ? match.player_a : code === "b" ? match.player_b : null;

  await supabase
    .from("matches")
    .update({
      status: "finished",
      score_a: scoreA,
      score_b: scoreB,
      winner,
      finished_at: new Date().toISOString(),
    })
    .eq("id", matchId)
    .neq("status", "finished");

  const { data: fresh } = await supabase
    .from("matches")
    .select("score_a, score_b, winner")
    .eq("id", matchId)
    .single();

  return {
    scoreA: fresh?.score_a ?? scoreA,
    scoreB: fresh?.score_b ?? scoreB,
    winner: fresh?.winner ?? winner,
    playerA: match.player_a,
    playerB: match.player_b,
  };
}

/**
 * Create a rematch: a new active match with the same two players (same topic)
 * and fresh questions. Called by the host (player_a) once both players accept.
 */
export async function createRematch(
  prevMatchId: string,
): Promise<{ matchId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const { data: prev, error: pErr } = await supabase
    .from("matches")
    .select("topic_id, player_a, player_b")
    .eq("id", prevMatchId)
    .single();
  if (pErr || !prev) return { error: "Match not found." };
  if (prev.player_a !== user.id) return { error: "Only the host can rematch." };
  if (!prev.player_b) return { error: "No opponent to rematch." };

  const { data: qs } = await supabase
    .from("questions")
    .select("id")
    .eq("topic_id", prev.topic_id);
  const ids = (qs ?? []).map((q) => q.id as string);
  if (ids.length === 0) return { error: "This topic has no questions." };
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  const { data: match, error: mErr } = await supabase
    .from("matches")
    .insert({
      topic_id: prev.topic_id,
      player_a: prev.player_a,
      player_b: prev.player_b,
      question_ids: ids.slice(0, QUESTIONS_PER_MATCH),
      status: "active",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (mErr) return { error: mErr.message };

  return { matchId: match.id as string };
}
