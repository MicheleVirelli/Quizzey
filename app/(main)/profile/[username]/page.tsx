import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FollowButton } from "@/components/FollowButton";
import { TopicsDonut, type DonutSegment } from "@/components/TopicsDonut";
import { signOut } from "@/lib/actions/auth";
import { countryByCode } from "@/lib/countries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const FALLBACK_COLORS = [
  "#e11d48", "#7c3aed", "#0ea5e9", "#059669", "#d97706", "#db2777", "#4f46e5", "#65a30d",
];

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();
  if (!profile) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isMe = user?.id === profile.id;

  // Social counts.
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.id),
  ]);

  let amIFollowing = false;
  if (user && !isMe) {
    const { data } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("following_id", profile.id)
      .maybeSingle();
    amIFollowing = Boolean(data);
  }

  // Country rank.
  let countryRank: number | null = null;
  if (profile.country) {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("country", profile.country)
      .gt("total_score", profile.total_score);
    countryRank = (count ?? 0) + 1;
  }

  // Per-topic stats.
  const { data: stats } = await supabase
    .from("topic_stats")
    .select("games, points, topic_id, topics(name, color, icon)")
    .eq("user_id", profile.id)
    .order("games", { ascending: false });

  const rows = (stats ?? []) as unknown as {
    games: number;
    points: number;
    topic_id: string;
    topics: { name: string; color: string | null; icon: string | null } | null;
  }[];

  const segments: DonutSegment[] = rows.map((r, i) => ({
    label: r.topics?.name ?? "Topic",
    value: r.games,
    color: r.topics?.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));

  // Best topic (most points) + rank within country.
  let bestTitle: { topic: string; rank: number } | null = null;
  const best = [...rows].sort((a, b) => b.points - a.points)[0];
  if (best && best.points > 0 && profile.country) {
    const { data: countryPeople } = await supabase
      .from("profiles")
      .select("id")
      .eq("country", profile.country);
    const ids = (countryPeople ?? []).map((p) => p.id);
    const { data: peers } = await supabase
      .from("topic_stats")
      .select("user_id, points")
      .eq("topic_id", best.topic_id)
      .in("user_id", ids.length ? ids : [profile.id]);
    const ahead = (peers ?? []).filter((p) => p.points > best.points).length;
    bestTitle = { topic: best.topics?.name ?? "Topic", rank: ahead + 1 };
  }

  const country = countryByCode(profile.country);
  const displayName = profile.display_name ?? profile.username;

  // W/D/L
  const wdlTotal = profile.wins + profile.ties + profile.losses;
  const pct = (n: number) => (wdlTotal ? Math.round((n / wdlTotal) * 100) : 0);

  return (
    <main className="flex flex-col gap-6 px-5 py-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-brand-600">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt="" fill unoptimized className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold">{displayName}</h1>
          <p className="text-sm text-neutral-500">@{profile.username}</p>
          {country && (
            <p className="text-sm">
              {country.flag} {country.name}
              {countryRank && (
                <span className="text-neutral-400"> · #{countryRank}</span>
              )}
            </p>
          )}
        </div>
        {!isMe && user && (
          <div className="flex shrink-0 flex-col items-end gap-2">
            <FollowButton userId={profile.id} initialFollowing={amIFollowing} />
            <Link
              href={`/challenge/${profile.username}`}
              className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              ⚔️ Challenge
            </Link>
          </div>
        )}
      </header>

      {/* Best topic banner */}
      {bestTitle && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-3 text-center font-bold text-amber-950 shadow">
          🏆 #{bestTitle.rank} in {bestTitle.topic}
          {country ? ` in ${country.name}` : ""}
        </div>
      )}

      {/* Counts */}
      <section className="grid grid-cols-3 divide-x divide-neutral-200 rounded-2xl border border-neutral-200 py-3 text-center dark:divide-neutral-800 dark:border-neutral-800">
        <Count label="Games" value={profile.games_played} accent />
        <Count label="Followers" value={followers ?? 0} />
        <Count label="Following" value={following ?? 0} />
      </section>

      {/* W/D/L */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-400">
          Statistics
        </h2>
        {wdlTotal === 0 ? (
          <p className="text-sm text-neutral-500">No 1v1 games played yet.</p>
        ) : (
          <>
            <div className="flex h-4 overflow-hidden rounded-full">
              <span className="bg-green-500" style={{ width: `${pct(profile.wins)}%` }} />
              <span className="bg-amber-400" style={{ width: `${pct(profile.ties)}%` }} />
              <span className="bg-brand-600" style={{ width: `${pct(profile.losses)}%` }} />
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-green-600">Wins {pct(profile.wins)}%</span>
              <span className="text-amber-500">Draws {pct(profile.ties)}%</span>
              <span className="text-brand-600">Losses {pct(profile.losses)}%</span>
            </div>
          </>
        )}
      </section>

      {/* Topics donut */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-400">
          Topics
        </h2>
        <TopicsDonut segments={segments} />
      </section>

      {isMe && (
        <div className="flex flex-col gap-2">
          <Link
            href="/settings"
            className="rounded-xl border border-neutral-300 px-4 py-3 text-center font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
          >
            Edit profile
          </Link>
          {profile.is_moderator && (
            <Link
              href="/moderation"
              className="rounded-xl border border-neutral-300 px-4 py-3 text-center font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
            >
              🛡️ Moderation
            </Link>
          )}
          <form action={signOut}>
            <button className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-neutral-500 hover:underline">
              Sign out
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

function Count({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div>
      <p className={`text-2xl font-extrabold ${accent ? "text-brand-600" : ""}`}>
        {value}
      </p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}
