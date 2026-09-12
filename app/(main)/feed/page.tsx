import Image from "next/image";
import Link from "next/link";
import { getCurrentUserAndProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/time";

export const dynamic = "force-dynamic";

interface MatchRow {
  id: string;
  topic_id: string;
  player_a: string;
  player_b: string | null;
  score_a: number;
  score_b: number;
  winner: string | null;
  finished_at: string | null;
}

interface Prof {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default async function FeedPage() {
  const { user } = await getCurrentUserAndProfile();
  if (!user) return null;
  const supabase = await createClient();

  // People I follow (+ me), so the feed is never empty for an active player.
  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);
  const ids = [user.id, ...(follows ?? []).map((f) => f.following_id as string)];
  const inList = `(${ids.join(",")})`;

  const { data: matchesData } = await supabase
    .from("matches")
    .select(
      "id, topic_id, player_a, player_b, score_a, score_b, winner, finished_at",
    )
    .eq("status", "finished")
    .not("player_b", "is", null)
    .or(`player_a.in.${inList},player_b.in.${inList}`)
    .order("finished_at", { ascending: false })
    .limit(30);

  const matches = (matchesData as MatchRow[] | null) ?? [];

  // Look up the profiles and topics referenced by the feed.
  const userIds = new Set<string>();
  const topicIds = new Set<string>();
  for (const m of matches) {
    userIds.add(m.player_a);
    if (m.player_b) userIds.add(m.player_b);
    topicIds.add(m.topic_id);
  }

  const [{ data: profs }, { data: topics }] = await Promise.all([
    userIds.size
      ? supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", [...userIds])
      : Promise.resolve({ data: [] as Prof[] }),
    topicIds.size
      ? supabase.from("topics").select("id, name, icon").in("id", [...topicIds])
      : Promise.resolve({ data: [] as { id: string; name: string; icon: string | null }[] }),
  ]);

  const profMap = new Map((profs ?? []).map((p) => [p.id, p as Prof]));
  const topicMap = new Map((topics ?? []).map((t) => [t.id, t]));

  return (
    <main className="flex flex-col gap-4 px-5 py-6">
      <h1 className="text-2xl font-extrabold text-brand-600">Feed</h1>

      {matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
          Nothing here yet. Follow players from the{" "}
          <Link href="/leaderboard" className="font-semibold text-brand-600">
            leaderboard
          </Link>{" "}
          and play some 1v1 matches to fill your feed.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {matches.map((m) => {
            const a = profMap.get(m.player_a);
            const b = m.player_b ? profMap.get(m.player_b) : undefined;
            const topic = topicMap.get(m.topic_id);
            const tie = m.winner === null;
            const winner = tie ? null : profMap.get(m.winner as string);
            const loser =
              tie || !winner
                ? null
                : m.winner === m.player_a
                  ? b
                  : a;
            const winScore =
              m.winner === m.player_a ? m.score_a : m.score_b;
            const loseScore =
              m.winner === m.player_a ? m.score_b : m.score_a;

            return (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800"
              >
                <Avatar prof={tie ? a : winner} />
                <div className="min-w-0 flex-1 text-sm">
                  {tie ? (
                    <p>
                      <Name p={a} /> tied <Name p={b} />
                      <span className="text-neutral-400">
                        {" "}
                        · {m.score_a}–{m.score_b}
                      </span>
                    </p>
                  ) : (
                    <p>
                      <Name p={winner} /> beat <Name p={loser} />
                      <span className="text-neutral-400">
                        {" "}
                        · {winScore}–{loseScore}
                      </span>
                    </p>
                  )}
                  <p className="text-xs text-neutral-400">
                    {topic?.icon} {topic?.name} · {timeAgo(m.finished_at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function Avatar({ prof }: { prof?: Prof | null }) {
  const label = (prof?.display_name ?? prof?.username ?? "?").charAt(0).toUpperCase();
  return (
    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-brand-600">
      {prof?.avatar_url ? (
        <Image src={prof.avatar_url} alt="" fill unoptimized className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-bold text-white">
          {label}
        </span>
      )}
    </span>
  );
}

function Name({ p }: { p?: Prof | null }) {
  if (!p) return <span className="font-semibold">Someone</span>;
  return (
    <Link href={`/profile/${p.username}`} className="font-semibold hover:underline">
      {p.display_name ?? p.username}
    </Link>
  );
}
