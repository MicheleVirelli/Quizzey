import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { getCurrentUserAndProfile, needsOnboarding } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user) redirect("/sign-in");
  if (needsOnboarding(profile)) redirect("/onboarding");

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <div className="flex-1">{children}</div>
      <BottomNav />
    </div>
  );
}
