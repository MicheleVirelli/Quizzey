"use server";

import { createClient } from "@/lib/supabase/server";
import { QUESTIONS_PER_MATCH } from "@/lib/scoring";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface QueueResult {
  matchId?: string;
  waiting?: boolean;
  error?: string;
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Find a recent, still-active match the user is part of. */
async function findMyActiveMatch(
  supabase: SupabaseClient,
  uid: string,
): Promise<string | null> {
  const threeMinAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("matches")
    .select("id")
    .or(`player_a.eq.${uid},player_b.eq.${uid}`)
    .eq("status", "active")
    .gte("started_at", threeMinAgo)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

/**
 * Join (or keep polling) the matchmaking queue for a topic. Called repeatedly
 * by the client until it returns a matchId. Pairing is deterministic: of two
 * waiting players, the one with the smaller id creates the match.
 */
export async function joinQueue(topicId: string): Promise<QueueResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  // Already matched? Go straight in.
  const mine = await findMyActiveMatch(supabase, user.id);
  if (mine) return { matchId: mine };

  // Make sure we're in the queue.
  await supabase
    .from("match_queue")
    .upsert({ user_id: user.id, topic_id: topicId });

  // Look for the oldest other waiting player on this topic.
  const { data: opp } = await supabase
    .from("match_queue")
    .select("user_id")
    .eq("topic_id", topicId)
    .neq("user_id", user.id)
    .order("enqueued_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!opp) return { waiting: true };
  const oppId = opp.user_id as string;

  // Deterministic creator = smaller id. The other waits and picks up the
  // created match on its next poll.
  if (user.id >= oppId) return { waiting: true };

  // Opponent may have just been matched by someone else.
  if (await findMyActiveMatch(supabase, oppId)) return { waiting: true };

  const { data: qs } = await supabase
    .from("questions")
    .select("id")
    .eq("topic_id", topicId);
  const ids = (qs ?? []).map((q) => q.id as string);
  if (ids.length === 0) return { error: "This topic has no questions." };
  const picked = shuffle(ids).slice(0, QUESTIONS_PER_MATCH);

  const { data: match, error: mErr } = await supabase
    .from("matches")
    .insert({
      topic_id: topicId,
      player_a: user.id,
      player_b: oppId,
      question_ids: picked,
      status: "active",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (mErr) return { error: mErr.message };

  await supabase
    .from("match_queue")
    .delete()
    .in("user_id", [user.id, oppId]);

  return { matchId: match.id as string };
}

export async function leaveQueue(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("match_queue").delete().eq("user_id", user.id);
}
