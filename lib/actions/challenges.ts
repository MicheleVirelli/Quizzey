"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { QUESTIONS_PER_MATCH } from "@/lib/scoring";

export interface ChallengeCard {
  id: string;
  status: string;
  matchId: string | null;
  topicName: string;
  topicIcon: string | null;
  name: string;
  username: string;
  avatarUrl: string | null;
}

export async function createChallenge(
  opponentId: string,
  topicId: string,
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };
  if (user.id === opponentId) return { error: "You can't challenge yourself." };

  // One pending challenge per opponent — reuse/refresh it if present.
  const { data: existing } = await supabase
    .from("challenges")
    .select("id")
    .eq("challenger_id", user.id)
    .eq("opponent_id", opponentId)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    await supabase
      .from("challenges")
      .update({ topic_id: topicId, created_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    const { error } = await supabase.from("challenges").insert({
      challenger_id: user.id,
      opponent_id: opponentId,
      topic_id: topicId,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/feed");
  return { ok: true };
}

export async function acceptChallenge(
  challengeId: string,
): Promise<{ matchId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const { data: ch } = await supabase
    .from("challenges")
    .select("id, challenger_id, opponent_id, topic_id, status, match_id")
    .eq("id", challengeId)
    .single();
  if (!ch) return { error: "Challenge not found." };
  if (ch.opponent_id !== user.id) return { error: "Not your challenge." };
  if (ch.status === "accepted" && ch.match_id) {
    return { matchId: ch.match_id as string };
  }
  if (ch.status !== "pending") return { error: "Challenge is no longer open." };

  const { data: qs } = await supabase
    .from("questions")
    .select("id")
    .eq("topic_id", ch.topic_id);
  const ids = (qs ?? []).map((q) => q.id as string);
  if (ids.length === 0) return { error: "This topic has no questions." };
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  // The accepter hosts the match (player_a) so RLS allows the insert.
  const { data: match, error: mErr } = await supabase
    .from("matches")
    .insert({
      topic_id: ch.topic_id,
      player_a: user.id,
      player_b: ch.challenger_id,
      question_ids: ids.slice(0, QUESTIONS_PER_MATCH),
      status: "active",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (mErr) return { error: mErr.message };

  await supabase
    .from("challenges")
    .update({ status: "accepted", match_id: match.id })
    .eq("id", challengeId);

  revalidatePath("/feed");
  return { matchId: match.id as string };
}

export async function declineChallenge(challengeId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("challenges")
    .update({ status: "declined" })
    .eq("id", challengeId)
    .eq("opponent_id", user.id);
  revalidatePath("/feed");
}

export async function getMyChallenges(): Promise<{
  incoming: ChallengeCard[];
  outgoing: ChallengeCard[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { incoming: [], outgoing: [] };

  const { data: rows } = await supabase
    .from("challenges")
    .select("*")
    .or(`opponent_id.eq.${user.id},challenger_id.eq.${user.id}`)
    .in("status", ["pending", "accepted"])
    .order("created_at", { ascending: false })
    .limit(40);

  const list = rows ?? [];
  const userIds = new Set<string>();
  const topicIds = new Set<string>();
  for (const c of list) {
    userIds.add(c.challenger_id);
    userIds.add(c.opponent_id);
    topicIds.add(c.topic_id);
  }

  const [{ data: profs }, { data: topics }] = await Promise.all([
    userIds.size
      ? supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", [...userIds])
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    topicIds.size
      ? supabase.from("topics").select("id, name, icon").in("id", [...topicIds])
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);
  const pmap = new Map((profs ?? []).map((p) => [p.id as string, p]));
  const tmap = new Map((topics ?? []).map((t) => [t.id as string, t]));

  const card = (c: (typeof list)[number], otherId: string): ChallengeCard => {
    const p = pmap.get(otherId);
    const t = tmap.get(c.topic_id);
    return {
      id: c.id,
      status: c.status,
      matchId: c.match_id,
      topicName: (t?.name as string) ?? "Topic",
      topicIcon: (t?.icon as string) ?? null,
      name: (p?.display_name as string) ?? (p?.username as string) ?? "Player",
      username: (p?.username as string) ?? "",
      avatarUrl: (p?.avatar_url as string) ?? null,
    };
  };

  const incoming = list
    .filter((c) => c.opponent_id === user.id && c.status === "pending")
    .map((c) => card(c, c.challenger_id));
  const outgoing = list
    .filter((c) => c.challenger_id === user.id)
    .map((c) => card(c, c.opponent_id));

  return { incoming, outgoing };
}
