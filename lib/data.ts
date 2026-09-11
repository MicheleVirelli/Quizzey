import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Fetch the signed-in user and their profile (or nulls when signed out). */
export async function getCurrentUserAndProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null as Profile | null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile: (profile as Profile | null) ?? null };
}

/** A profile needs onboarding until it has a real username and a country. */
export function needsOnboarding(profile: Profile | null): boolean {
  if (!profile) return true;
  return !profile.country || profile.username.startsWith("player_");
}
