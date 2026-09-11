import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Topic } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TopicsPage() {
  const supabase = await createClient();
  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .order("is_official", { ascending: false })
    .order("name");

  const list = (topics as Topic[] | null) ?? [];

  return (
    <main className="flex flex-col gap-5 px-5 py-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-600">
            Choose a topic
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            10 questions · 10 seconds each · last one is worth double.
          </p>
        </div>
        <Link
          href="/create"
          className="shrink-0 rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          + New
        </Link>
      </header>

      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
          No topics yet. Run <code>supabase/seed.sql</code> to add starter topics.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {list.map((topic) => (
            <li key={topic.id}>
              <Link
                href={`/play/${topic.slug}`}
                className="flex h-full flex-col gap-2 rounded-2xl border border-neutral-200 p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800"
                style={{
                  borderTopColor: topic.color ?? "#e11d48",
                  borderTopWidth: 4,
                }}
              >
                <span className="text-3xl">{topic.icon ?? "❓"}</span>
                <span className="font-semibold leading-tight">{topic.name}</span>
                {topic.category && (
                  <span className="text-xs text-neutral-400">
                    {topic.category}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
