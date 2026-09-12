"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

export function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone;
    if (standalone) setInstalled(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (installed) return null;

  async function onClick() {
    if (deferred) {
      await deferred.prompt();
      setDeferred(null);
    } else {
      setShowHelp((s) => !s);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onClick}
        className="rounded-xl border border-neutral-300 px-4 py-3 text-center font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
      >
        📲 Install app
      </button>
      {showHelp && (
        <p className="rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
          On iPhone: tap the <strong>Share</strong> button, then{" "}
          <strong>Add to Home Screen</strong>. On Android: open the browser menu
          and choose <strong>Install app</strong> / <strong>Add to Home screen</strong>.
        </p>
      )}
    </div>
  );
}
