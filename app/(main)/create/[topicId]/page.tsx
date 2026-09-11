import { notFound, redirect } from "next/navigation";
import { AddQuestionForm } from "@/components/AddQuestionForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AddQuestionsPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: topic } = await supabase
    .from("topics")
    .select("id, slug, name, created_by")
    .eq("id", topicId)
    .single();
  if (!topic) notFound();
  // Only the topic's creator can add questions from this screen.
  if (topic.created_by !== user.id) notFound();

  const { count } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("topic_id", topicId);

  return (
    <main className="flex flex-col gap-5 px-5 py-6">
      <header>
        <h1 className="text-2xl font-extrabold text-brand-600">{topic.name}</h1>
        <p className="text-sm text-neutral-500">Add questions to your topic.</p>
      </header>
      <AddQuestionForm
        topicId={topic.id}
        topicSlug={topic.slug}
        initialCount={count ?? 0}
      />
    </main>
  );
}
