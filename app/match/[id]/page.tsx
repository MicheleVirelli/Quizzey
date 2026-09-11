import { notFound, redirect } from "next/navigation";
import { VersusGame } from "@/components/VersusGame";
import { createClient } from "@/lib/supabase/server";
import type { Question } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .single();
  if (!match) notFound();
  if (match.player_a !== user.id && match.player_b !== user.id) notFound();

  // Questions in the exact order stored on the match.
  const questionIds = match.question_ids as string[];
  const { data: qs } = await supabase
    .from("questions")
    .select("*")
    .in("id", questionIds);
  const byId = new Map((qs as Question[] | null ?? []).map((q) => [q.id, q]));
  const questions = questionIds
    .map((qid) => byId.get(qid))
    .filter((q): q is Question => Boolean(q));

  // Both players' names.
  const ids = [match.player_a, match.player_b].filter(Boolean) as string[];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", ids);
  const nameOf = (uid: string | null) => {
    if (!uid) return "Opponent";
    const p = (profiles ?? []).find((x) => x.id === uid);
    return (p?.display_name as string) ?? (p?.username as string) ?? "Player";
  };

  const { data: topic } = await supabase
    .from("topics")
    .select("name, icon, color")
    .eq("id", match.topic_id)
    .single();

  return (
    <VersusGame
      matchId={match.id}
      currentUserId={user.id}
      playerA={match.player_a}
      playerB={match.player_b}
      nameA={nameOf(match.player_a)}
      nameB={nameOf(match.player_b)}
      questions={questions}
      topicName={topic?.name ?? "Match"}
    />
  );
}
