"use server";

import { createClient } from "@/lib/supabase/server";
import { QUESTIONS_PER_MATCH } from "@/lib/scoring";

export interface VersusResult {
  scoreA: number;
  scoreB: number;
  winner: string | null;
  playerA: string;
  playerB: string | null;
}

/**
 * Record the final scores of a 1v1 match and mark it finished (which fires the
 * per-player win/loss/score + topic stats trigger).
 *
 * Scores are computed on the clients from the realtime answer stream (which is
 * complete and matches what both players saw), then submitted here. Safe to
 * call by either player and more than once: only the first active -> finished
 * transition writes, so the trigger never double-counts.
 */
export async function submitVersusResult(
  matchId: string,
  scoreA: number,
  scoreB: number,
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

  const max = (match.question_ids as string[]).length + 1;
  const a = Math.max(0, Math.min(max, Math.round(scoreA)));
  const b = Math.max(0, Math.min(max, Math.round(scoreB)));
  const winner = a > b ? match.player_a : b > a ? match.player_b : null;

  await supabase
    .from("matches")
    .update({
      status: "finished",
      score_a: a,
      score_b: b,
      winner,
      finished_at: new Date().toISOString(),
    })
    .eq("id", matchId)
    .neq("status", "finished");

  // Re-read so both players converge on the stored (first-writer) result.
  const { data: fresh } = await supabase
    .from("matches")
    .select("score_a, score_b, winner, player_a, player_b")
    .eq("id", matchId)
    .single();

  return {
    scoreA: fresh?.score_a ?? a,
    scoreB: fresh?.score_b ?? b,
    winner: fresh?.winner ?? winner,
    playerA: match.player_a,
    playerB: match.player_b,
  };
}

/**
 * Create a rematch: a new active match with the same two players (same topic)
 * and a fresh set of random questions. Called by the leader (player_a) once
 * both players have accepted the rematch.
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
