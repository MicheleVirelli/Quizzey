"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "@/lib/actions/auth";

export function AuthForm({
  mode,
  action,
  next,
}: {
  mode: "sign-in" | "sign-up";
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const isSignIn = mode === "sign-in";

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-brand-600">Quizzey</h1>
        <p className="mt-1 text-neutral-500 dark:text-neutral-400">
          {isSignIn ? "Welcome back" : "Create your account"}
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-3">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Password
          <input
            type="password"
            name="password"
            required
            minLength={6}
            autoComplete={isSignIn ? "current-password" : "new-password"}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        {state.error && (
          <p className="text-sm text-brand-600">{state.error}</p>
        )}
        {state.message && (
          <p className="text-sm text-green-600">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Please wait…" : isSignIn ? "Sign in" : "Sign up"}
        </button>
      </form>

      <p className="text-center text-sm text-neutral-500">
        {isSignIn ? (
          <>
            No account?{" "}
            <Link href="/sign-up" className="font-semibold text-brand-600 hover:underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/sign-in" className="font-semibold text-brand-600 hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </main>
  );
}
