"use server";

import { createClient } from "@/lib/supabase/server";
import { outcome, pointsForQuestion } from "@/lib/scoring";

export interface VersusResult {
  scoreA: number;
  scoreB: number;
  winner: string | null;
  playerA: string;
  playerB: string | null;
}

/**
 * Compute the final scores of a 1v1 match from the persisted answers and mark
 * it finished (which triggers the per-player win/loss/score stats update).
 *
 * Safe to call by either player and more than once: the update only fires the
 * finish trigger on the first active -> finished transition.
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

  // Already finalized — return stored result.
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

  // For each question, the FIRST correct answer (smallest time) wins the point.
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

  // Only transition once (guards the stats trigger against double counting).
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

  return {
    scoreA,
    scoreB,
    winner,
    playerA: match.player_a,
    playerB: match.player_b,
  };
}
