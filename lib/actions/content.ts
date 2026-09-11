"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ContentState = { error?: string; message?: string };

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "topic"}-${suffix}`;
}

export async function createTopic(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim() || "❓";
  const color = String(formData.get("color") ?? "").trim() || "#e11d48";

  if (name.length < 3) {
    return { error: "Topic name must be at least 3 characters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: topic, error } = await supabase
    .from("topics")
    .insert({
      slug: slugify(name),
      name,
      description: description || null,
      category: category || "Community",
      icon,
      color,
      is_official: false,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/topics");
  redirect(`/create/${topic.id}`);
}

export async function addQuestion(
  topicId: string,
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  const text = String(formData.get("text") ?? "").trim();
  const answers = [0, 1, 2, 3].map((i) =>
    String(formData.get(`answer${i}`) ?? "").trim(),
  );
  const correctIndex = Number(formData.get("correct_index"));

  if (text.length < 3) return { error: "Question text is too short." };
  if (answers.some((a) => a.length === 0)) {
    return { error: "Please fill in all four answers." };
  }
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
    return { error: "Please mark which answer is correct." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { error } = await supabase.from("questions").insert({
    topic_id: topicId,
    text,
    answers,
    correct_index: correctIndex,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/create/${topicId}`);
  return { message: "Question added!" };
}
