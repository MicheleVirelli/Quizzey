import { notFound, redirect } from "next/navigation";
import { SoloGame } from "@/components/SoloGame";
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

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("topic_id", (topic as Topic).id);

  const pool = (questions as Question[] | null) ?? [];
  const picked = shuffle(pool).slice(0, QUESTIONS_PER_MATCH);

  if (picked.length === 0) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold">
          This topic has no questions yet.
        </p>
        <a href="/topics" className="font-semibold text-brand-600 hover:underline">
          ← Back to topics
        </a>
      </main>
    );
  }

  return <SoloGame topic={topic as Topic} questions={picked} />;
}
