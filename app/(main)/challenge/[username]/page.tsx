import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChallengeForm } from "@/components/ChallengeForm";
import { createClient } from "@/lib/supabase/server";
import type { Topic } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: opponent } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username)
    .single();
  if (!opponent) notFound();
  if (opponent.id === user.id) redirect(`/profile/${username}`);

  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .order("is_official", { ascending: false })
    .order("name");

  return (
    <main className="flex min-h-dvh flex-col gap-4 px-5 py-6">
      <header>
        <h1 className="text-2xl font-extrabold text-brand-600">Challenge</h1>
      </header>
      <ChallengeForm
        opponentId={opponent.id}
        opponentName={opponent.display_name ?? opponent.username}
        topics={(topics as Topic[] | null) ?? []}
      />
      <Link
        href={`/profile/${username}`}
        className="mt-2 text-sm text-neutral-500 hover:underline"
      >
        ← Back
      </Link>
    </main>
  );
}
