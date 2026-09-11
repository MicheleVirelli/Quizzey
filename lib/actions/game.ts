"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { pointsForQuestion } from "@/lib/scoring";

export interface SoloAnswerInput {
  questionId: string;
  selectedIndex: number | null;
}

export interface SoloResult {
  score: number;
  max: number;
  correctCount: number;
  total: number;
}

/**
 * Records a completed solo practice run. The score is recomputed on the server
 * from the stored correct answers (the client's answers are not trusted), and
 * the player's total score / games played are updated.
 */
export async function recordSoloMatch(
  topicId: string,
  answers: SoloAnswerInput[],
): Promise<SoloResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const questionIds = answers.map((a) => a.questionId);

  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .select("id, correct_index")
    .in("id", questionIds);
  if (qErr) throw new Error(qErr.message);

  const correctById = new Map(
    (questions ?? []).map((q) => [q.id as string, q.correct_index as number]),
  );

  let score = 0;
  let correctCount = 0;
  answers.forEach((a, position) => {
    const correctIndex = correctById.get(a.questionId);
    const isCorrect =
      a.selectedIndex != null && a.selectedIndex === correctIndex;
    if (isCorrect) {
      score += pointsForQuestion(position, answers.length);
      correctCount += 1;
    }
  });

  const max = answers.reduce(
    (sum, _a, i) => sum + pointsForQuestion(i, answers.length),
    0,
  );

  const nowIso = new Date().toISOString();

  // Solo match is inserted directly as finished (the finish trigger only fires
  // on UPDATE, so solo runs don't affect win/loss/tie records).
  const { data: match, error: mErr } = await supabase
    .from("matches")
    .insert({
      topic_id: topicId,
      player_a: user.id,
      player_b: null,
      question_ids: questionIds,
      status: "finished",
      score_a: score,
      started_at: nowIso,
      finished_at: nowIso,
    })
    .select("id")
    .single();
  if (mErr) throw new Error(mErr.message);

  // Log the individual answers.
  const answerRows = answers.map((a) => ({
    match_id: match.id as string,
    user_id: user.id,
    question_id: a.questionId,
    selected_index: a.selectedIndex,
    is_correct: a.selectedIndex === correctById.get(a.questionId),
  }));
  await supabase.from("match_answers").insert(answerRows);

  // Update aggregate stats: practice adds to score & games, not W/L.
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_score, games_played")
    .eq("id", user.id)
    .single();
  if (profile) {
    await supabase
      .from("profiles")
      .update({
        total_score: (profile.total_score as number) + score,
        games_played: (profile.games_played as number) + 1,
      })
      .eq("id", user.id);
  }

  revalidatePath("/profile");
  revalidatePath("/leaderboard");

  return { score, max, correctCount, total: answers.length };
}
