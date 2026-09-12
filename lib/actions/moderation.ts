"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setTopicOfficial(
  topicId: string,
  official: boolean,
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("topics")
    .update({ is_official: official })
    .eq("id", topicId);
  revalidatePath("/moderation");
  revalidatePath("/topics");
}

export async function deleteTopic(topicId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("topics").delete().eq("id", topicId);
  revalidatePath("/moderation");
  revalidatePath("/topics");
}
