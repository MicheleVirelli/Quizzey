import { notFound } from "next/navigation";
import { ModerationControls } from "@/components/ModerationControls";
import { getCurrentUserAndProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Topic } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  const { profile } = await getCurrentUserAndProfile();
  if (!profile?.is_moderator) notFound();

  const supabase = await createClient();
  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .order("is_official", { ascending: false })
    .order("created_at", { ascending: false });

  const list = (topics as Topic[] | null) ?? [];

  return (
    <main className="flex flex-col gap-4 px-5 py-6">
      <header>
        <h1 className="text-2xl font-extrabold text-brand-600">Moderation</h1>
        <p className="text-sm text-neutral-500">
          Curate topics: promote good community topics to official, or remove
          inappropriate ones.
        </p>
      </header>

      <ul className="flex flex-col gap-2">
        {list.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800"
          >
            <span className="text-2xl">{t.icon ?? "❓"}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {t.name}
                {t.is_official && (
                  <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700 dark:bg-green-950 dark:text-green-300">
                    official
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-neutral-400">
                {t.category ?? "Community"}
              </p>
            </div>
            <ModerationControls topicId={t.id} isOfficial={t.is_official} />
          </li>
        ))}
        {list.length === 0 && (
          <p className="text-sm text-neutral-500">No topics.</p>
        )}
      </ul>
    </main>
  );
}
