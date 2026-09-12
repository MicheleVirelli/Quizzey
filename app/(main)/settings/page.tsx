import { AvatarUpload } from "@/components/AvatarUpload";
import { ProfileForm } from "@/components/ProfileForm";
import { updateProfile } from "@/lib/actions/profile";
import { getCurrentUserAndProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { profile } = await getCurrentUserAndProfile();
  if (!profile) return null;

  return (
    <main className="flex flex-col gap-6 px-5 py-6">
      <h1 className="text-2xl font-extrabold text-brand-600">Settings</h1>
      <AvatarUpload
        currentUrl={profile.avatar_url}
        name={profile.display_name ?? profile.username}
      />
      <ProfileForm
        action={updateProfile}
        submitLabel="Save changes"
        initial={{
          username: profile.username,
          display_name: profile.display_name,
          country: profile.country,
        }}
      />
    </main>
  );
}
