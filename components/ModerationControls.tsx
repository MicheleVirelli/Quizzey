"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteTopic, setTopicOfficial } from "@/lib/actions/moderation";

export function ModerationControls({
  topicId,
  isOfficial,
}: {
  topicId: string;
  isOfficial: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function toggle() {
    startTransition(async () => {
      await setTopicOfficial(topicId, !isOfficial);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteTopic(topicId);
      router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        onClick={toggle}
        disabled={pending}
        className="rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-semibold disabled:opacity-60 dark:border-neutral-700"
      >
        {isOfficial ? "Unofficial" : "Make official"}
      </button>
      {confirming ? (
        <button
          onClick={remove}
          disabled={pending}
          className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-bold text-white disabled:opacity-60"
        >
          Confirm
        </button>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          disabled={pending}
          className="rounded-lg border border-brand-300 px-2.5 py-1 text-xs font-semibold text-brand-600 disabled:opacity-60 dark:border-brand-800"
        >
          Delete
        </button>
      )}
    </div>
  );
}
