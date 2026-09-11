import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Backend health check. Open this page locally (`npm run dev`) or on the
 * Vercel deployment to confirm the app can reach Supabase.
 */
export default async function HealthPage() {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  let ok = false;
  let topicCount: number | null = null;
  let errorMessage: string | null = null;

  if (hasUrl && hasKey) {
    try {
      const supabase = await createClient();
      const { count, error } = await supabase
        .from("topics")
        .select("*", { count: "exact", head: true });
      if (error) {
        errorMessage = error.message;
      } else {
        ok = true;
        topicCount = count ?? 0;
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
    }
  } else {
    errorMessage = "Missing Supabase environment variables.";
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold text-brand-600">Backend status</h1>

      <div
        className={`rounded-xl border p-4 ${
          ok
            ? "border-green-300 bg-green-50 dark:border-green-900 dark:bg-green-950/40"
            : "border-brand-300 bg-brand-50 dark:border-brand-900 dark:bg-brand-950/40"
        }`}
      >
        <p className="text-lg font-semibold">
          {ok ? "✅ Connected to Supabase" : "❌ Not connected"}
        </p>
        {ok && (
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            Found <strong>{topicCount}</strong> topic
            {topicCount === 1 ? "" : "s"} in the database.
            {topicCount === 0 &&
              " Run supabase/seed.sql to add starter topics."}
          </p>
        )}
        {errorMessage && (
          <p className="mt-1 break-words text-sm text-brand-700 dark:text-brand-300">
            {errorMessage}
          </p>
        )}
      </div>

      <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
        <li>
          NEXT_PUBLIC_SUPABASE_URL: {hasUrl ? "✅ set" : "❌ missing"}
        </li>
        <li>
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: {hasKey ? "✅ set" : "❌ missing"}
        </li>
      </ul>

      <Link href="/" className="text-sm font-semibold text-brand-600 hover:underline">
        ← Back home
      </Link>
    </main>
  );
}
