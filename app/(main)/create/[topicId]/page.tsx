import { notFound } from "next/navigation";
import { AddQuestionForm } from "@/components/AddQuestionForm";
import { EditTopicForm } from "@/components/EditTopicForm";
import { QuestionList } from "@/components/QuestionList";
import { getCurrentUserAndProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Topic } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ManageTopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user) notFound();

  const supabase = await createClient();
  const { data: topic } = await supabase
    .from("topics")
    .select("*")
    .eq("id", topicId)
    .single();
  if (!topic) notFound();

  const canManage =
    (topic as Topic).created_by === user.id || Boolean(profile?.is_moderator);
  if (!canManage) notFound();

  const { data: questions } = await supabase
    .from("questions")
    .select("id, text")
    .eq("topic_id", topicId)
    .order("created_at", { ascending: true });
  const rows = (questions ?? []) as { id: string; text: string }[];

  return (
    <main className="flex flex-col gap-6 px-5 py-6">
      <header>
        <h1 className="text-2xl font-extrabold text-brand-600">
          {(topic as Topic).name}
        </h1>
        <p className="text-sm text-neutral-500">Edit your topic and questions.</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-400">
          Topic details
        </h2>
        <EditTopicForm topic={topic as Topic} />
      </section>

      <QuestionList topicId={topicId} questions={rows} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-400">
          Add a question
        </h2>
        <AddQuestionForm
          topicId={(topic as Topic).id}
          topicSlug={(topic as Topic).slug}
          initialCount={rows.length}
        />
      </section>
    </main>
  );
}
