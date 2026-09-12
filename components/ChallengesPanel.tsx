"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  acceptChallenge,
  declineChallenge,
  getMyChallenges,
  type ChallengeCard,
} from "@/lib/actions/challenges";

export function ChallengesPanel() {
  const router = useRouter();
  const [incoming, setIncoming] = useState<ChallengeCard[]>([]);
  const [outgoing, setOutgoing] = useState<ChallengeCard[]>([]);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    const data = await getMyChallenges();
    setIncoming(data.incoming);
    setOutgoing(data.outgoing);
  }, []);

  useEffect(() => {
    let active = true;
    load();
    const t = setInterval(() => {
      if (active) load();
    }, 5000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [load]);

  function accept(id: string) {
    startTransition(async () => {
      const res = await acceptChallenge(id);
      if (res.matchId) router.push(`/match/${res.matchId}`);
      else await load();
    });
  }

  function decline(id: string) {
    startTransition(async () => {
      await declineChallenge(id);
      await load();
    });
  }

  const acceptedOut = outgoing.filter((c) => c.status === "accepted" && c.matchId);
  const pendingOut = outgoing.filter((c) => c.status === "pending");

  if (
    incoming.length === 0 &&
    acceptedOut.length === 0 &&
    pendingOut.length === 0
  ) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-400">
        Challenges
      </h2>

      {incoming.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-3 rounded-2xl border-2 border-brand-500 bg-brand-50 p-3 dark:bg-brand-950/40"
        >
          <Avatar c={c} />
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate">
              <strong>{c.name}</strong> challenges you
            </p>
            <p className="text-xs text-neutral-500">
              {c.topicIcon} {c.topicName}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => accept(c.id)}
              disabled={pending}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-bold text-white disabled:opacity-60"
            >
              Accept
            </button>
            <button
              onClick={() => decline(c.id)}
              disabled={pending}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-semibold disabled:opacity-60 dark:border-neutral-700"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      {acceptedOut.map((c) => (
        <Link
          key={c.id}
          href={`/match/${c.matchId}`}
          className="flex items-center gap-3 rounded-2xl border-2 border-green-500 bg-green-50 p-3 dark:bg-green-950/40"
        >
          <Avatar c={c} />
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate">
              <strong>{c.name}</strong> accepted!
            </p>
            <p className="text-xs text-neutral-500">
              {c.topicIcon} {c.topicName}
            </p>
          </div>
          <span className="shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-bold text-white">
            Join
          </span>
        </Link>
      ))}

      {pendingOut.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-3 text-neutral-500 dark:border-neutral-800"
        >
          <Avatar c={c} />
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate">
              Waiting for <strong>{c.name}</strong>…
            </p>
            <p className="text-xs text-neutral-400">
              {c.topicIcon} {c.topicName}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}

function Avatar({ c }: { c: ChallengeCard }) {
  return (
    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-brand-600">
      {c.avatarUrl ? (
        <Image src={c.avatarUrl} alt="" fill unoptimized className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-bold text-white">
          {c.name.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}
