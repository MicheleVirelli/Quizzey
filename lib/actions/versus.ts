"use server";

import { createClient } from "@/lib/supabase/server";

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
