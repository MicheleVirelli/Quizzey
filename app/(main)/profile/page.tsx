import { signOut } from "@/lib/actions/auth";
import { countryByCode } from "@/lib/countries";
import { getCurrentUserAndProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { profile } = await getCurrentUserAndProfile();
  if (!profile) return null;

  const supabase = await createClient();

  // Global rank = 1 + number of players with a strictly higher score.
  const { count: globalAhead } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gt("total_score", profile.total_score);

  // Country rank among players in the same country.
  let countryRank: number | null = null;
  if (profile.country) {
    const { count: countryAhead } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("country", profile.country)
      .gt("total_score", profile.total_score);
    countryRank = (countryAhead ?? 0) + 1;
  }

  const country = countryByCode(profile.country);
  const globalRank = (globalAhead ?? 0) + 1;

  return (
    <main className="flex flex-col gap-6 px-5 py-6">
      <header className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white">
          {(profile.display_name ?? profile.username).charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-extrabold">
            {profile.display_name ?? profile.username}
          </h1>
          <p className="text-sm text-neutral-500">@{profile.username}</p>
          {country && (
            <p className="text-sm">
              {country.flag} {country.name}
            </p>
          )}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <Stat label="Total score" value={profile.total_score} accent />
        <Stat label="Games played" value={profile.games_played} />
        <Stat
          label="Country rank"
          value={countryRank ? `#${countryRank}` : "—"}
        />
        <Stat label="Global rank" value={`#${globalRank}`} />
      </section>

      <section className="grid grid-cols-3 gap-3 text-center">
        <MiniStat label="Wins" value={profile.wins} />
        <MiniStat label="Losses" value={profile.losses} />
        <MiniStat label="Ties" value={profile.ties} />
      </section>

      <form action={signOut}>
        <button
          type="submit"
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 font-semibold text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
      <p
        className={`text-3xl font-extrabold ${
          accent ? "text-brand-600" : ""
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-neutral-100 py-3 dark:bg-neutral-900">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}
