"use client";

import Image from "next/image";
import { useActionState } from "react";
import { updateAvatar, type ProfileState } from "@/lib/actions/profile";

export function AvatarUpload({
  currentUrl,
  name,
}: {
  currentUrl: string | null;
  name: string;
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateAvatar,
    {},
  );

  return (
    <form action={formAction} className="flex items-center gap-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-brand-600">
        {currentUrl ? (
          <Image src={currentUrl} alt="" fill unoptimized className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <input
          type="file"
          name="avatar"
          accept="image/*"
          className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-200 file:px-3 file:py-1.5 file:font-semibold dark:file:bg-neutral-800"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Uploading…" : "Upload photo"}
        </button>
        {state.error && <p className="text-xs text-brand-600">{state.error}</p>}
        {state.message && <p className="text-xs text-green-600">{state.message}</p>}
      </div>
    </form>
  );
}
