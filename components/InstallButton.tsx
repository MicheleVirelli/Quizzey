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
  const [ios, setIos] = useState(false);
  const [iosSafari, setIosSafari] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    setIos(isIos);
    // iOS Safari only — Chrome (CriOS), Firefox (FxiOS), Edge (EdgiOS) etc. can't "Add to Home Screen".
    setIosSafari(isIos && /safari/i.test(ua) && !/crios|fxios|edgios|opt\//i.test(ua));

    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
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
      {showHelp && !deferred && (
        <div className="rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
          {ios ? (
            iosSafari ? (
              <p>
                Tap the <strong>Share</strong> button (the square with an arrow at
                the bottom of Safari), scroll down and tap{" "}
                <strong>Add to Home Screen</strong>.
              </p>
            ) : (
              <p>
                On iPhone the app can only be installed from{" "}
                <strong>Safari</strong>. Open{" "}
                <strong>quizzey-six.vercel.app</strong> in Safari, then tap{" "}
                <strong>Share</strong> → <strong>Add to Home Screen</strong>.
              </p>
            )
          ) : (
            <p>
              Open the browser menu (⋮) and choose <strong>Install app</strong> or{" "}
              <strong>Add to Home screen</strong>. If you don&apos;t see it, use{" "}
              <strong>Chrome</strong>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
