"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { follow, unfollow } from "@/lib/actions/social";

export function FollowButton({
  userId,
  initialFollowing,
}: {
  userId: string;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      if (next) await follow(userId);
      else await unfollow(userId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`rounded-xl px-5 py-2 text-sm font-bold transition disabled:opacity-60 ${
        following
          ? "border border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
          : "bg-brand-600 text-white hover:bg-brand-700"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
