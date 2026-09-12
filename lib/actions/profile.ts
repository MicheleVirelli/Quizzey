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

export async function updateAvatar(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image first." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Image must be 5 MB or smaller." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) return { error: `Upload failed: ${upErr.message}` };

  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: pub.publicUrl })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/settings");
  return { message: "Photo updated!" };
}
