import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/ProfileForm";
import { completeOnboarding } from "@/lib/actions/profile";
import { getCurrentUserAndProfile, needsOnboarding } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user) redirect("/sign-in");
  if (!needsOnboarding(profile)) redirect("/topics");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-brand-600">
          Set up your profile
        </h1>
        <p className="mt-1 text-neutral-500 dark:text-neutral-400">
          Pick a username and your country to get on the leaderboard.
        </p>
      </div>
      <ProfileForm
        action={completeOnboarding}
        submitLabel="Start playing"
        initial={{
          username: profile?.username,
          display_name: profile?.display_name,
          country: profile?.country,
        }}
      />
    </main>
  );
}
