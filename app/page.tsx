import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-600 text-4xl shadow-lg shadow-brand-600/30">
          🧠
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-brand-600">
          Quizzey
        </h1>
        <p className="max-w-xs text-balance text-neutral-500 dark:text-neutral-400">
          Real-time 1v1 trivia across every topic. 10 questions, 10 seconds
          each — beat your friends and climb your country&apos;s leaderboard.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <Link
          href="/topics"
          className="rounded-xl bg-brand-600 px-5 py-3 font-bold text-white transition hover:bg-brand-700"
        >
          Play now
        </Link>
        <Link
          href="/sign-in"
          className="rounded-xl border border-neutral-200 px-5 py-3 font-semibold text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-900"
        >
          Sign in
        </Link>
      </div>

      <Link href="/health" className="text-xs text-neutral-400 hover:underline">
        Backend status
      </Link>
    </main>
  );
}
