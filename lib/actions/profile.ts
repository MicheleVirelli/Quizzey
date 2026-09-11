"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { error?: string; message?: string };

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

function readProfileFields(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const display_name = String(formData.get("display_name") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  return { username, display_name, country };
}

export async function completeOnboarding(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const { username, display_name, country } = readProfileFields(formData);

  if (!USERNAME_RE.test(username)) {
    return {
      error: "Username must be 3–20 letters, numbers or underscores.",
    };
  }
  if (!country) return { error: "Please pick your country." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: display_name || username,
      country,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "That username is already taken." };
    }
    return { error: error.message };
  }

  redirect("/topics");
}

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const { username, display_name, country } = readProfileFields(formData);

  if (!USERNAME_RE.test(username)) {
    return { error: "Username must be 3–20 letters, numbers or underscores." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: display_name || username,
      country: country || null,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "That username is already taken." };
    }
    return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/settings");
  return { message: "Profile updated." };
}
