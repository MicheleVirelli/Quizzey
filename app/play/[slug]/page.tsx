import { notFound, redirect } from "next/navigation";
import { TopicLobby } from "@/components/TopicLobby";
import { QUESTIONS_PER_MATCH } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/server";
import type { Question, Topic } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Fisher–Yates shuffle (returns a new array). */
function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function PlayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: topic } = await supabase
    .from("topics")
    .select("*")
    .eq("slug", slug)
    .single();
  if (!topic) notFound();

  const { data: me } = await supabase
    .from("profiles")
    .select("is_moderator")
    .eq("id", user.id)
    .single();
  const canManage =
    (topic as Topic).created_by === user.id || Boolean(me?.is_moderator);

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("topic_id", (topic as Topic).id);

  const pool = (questions as Question[] | null) ?? [];
  const soloQuestions = shuffle(pool).slice(0, QUESTIONS_PER_MATCH);

  return (
    <TopicLobby
      topic={topic as Topic}
      soloQuestions={soloQuestions}
      canManage={canManage}
    />
  );
}
