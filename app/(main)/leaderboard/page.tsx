import Link from "next/link";
import { countryByCode } from "@/lib/countries";
import { getCurrentUserAndProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const { scope } = await searchParams;
  const { profile } = await getCurrentUserAndProfile();
  const countryScope = scope === "country" && Boolean(profile?.country);

  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("id, username, display_name, country, total_score")
    .order("total_score", { ascending: false })
    .limit(50);
  if (countryScope && profile?.country) {
    query = query.eq("country", profile.country);
  }
  const { data } = await query;
  const rows = (data as Partial<Profile>[] | null) ?? [];

  const country = countryByCode(profile?.country);

  return (
    <main className="flex flex-col gap-4 px-5 py-6">
      <h1 className="text-2xl font-extrabold text-brand-600">Leaderboard</h1>

      <div className="flex gap-2">
        <Tab active={!countryScope} href="/leaderboard" label="🌍 Global" />
        <Tab
          active={countryScope}
          href="/leaderboard?scope=country"
          label={country ? `${country.flag} ${country.name}` : "My country"}
        />
      </div>

      <ol className="flex flex-col gap-1">
        {rows.map((row, i) => {
          const isMe = row.id === profile?.id;
          const c = countryByCode(row.country ?? null);
          return (
            <li
              key={row.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                isMe
                  ? "bg-brand-50 dark:bg-brand-950/40"
                  : "odd:bg-neutral-50 dark:odd:bg-neutral-900/50"
              }`}
            >
              <span className="w-6 text-center font-bold text-neutral-400">
                {i + 1}
              </span>
              <span className="flex-1 truncate font-medium">
                {row.display_name ?? row.username}
                {isMe && (
                  <span className="ml-1 text-xs text-brand-600">(you)</span>
                )}
              </span>
              {!countryScope && c && <span>{c.flag}</span>}
              <span className="font-bold text-brand-600">
                {row.total_score}
              </span>
            </li>
          );
        })}
        {rows.length === 0 && (
          <p className="py-8 text-center text-sm text-neutral-500">
            No players yet. Play a round to get on the board!
          </p>
        )}
      </ol>
    </main>
  );
}

function Tab({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
        active
          ? "bg-brand-600 text-white"
          : "border border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
      }`}
    >
      {label}
    </Link>
  );
}
