import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MyProfilePage() {
  const { profile } = await getCurrentUserAndProfile();
  if (!profile) redirect("/sign-in");
  redirect(`/profile/${profile.username}`);
}
