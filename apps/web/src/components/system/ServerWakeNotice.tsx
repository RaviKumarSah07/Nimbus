"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, ServerCog } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";
const HEALTH_URL = `${API_BASE_URL}/health`;

/**
 * Long enough that a warm API never flashes this at anyone - a healthy
 * response comes back in well under a second - but short enough that nobody
 * spends meaningful time staring at empty product grids wondering what broke.
 */
const SHOW_AFTER_MS = 1800;
const RETRY_DELAY_MS = 2000;
/** Past this the wait stops looking like a normal cold start, so the copy softens its promise. */
const SLOW_AFTER_MS = 35000;
/** Never trap someone behind this - the static parts of the site are still readable. */
const DISMISSIBLE_AFTER_MS = 8000;

type Phase = "checking" | "ready";

/**
 * The API is deployed on a free tier that sleeps after inactivity, so the
 * first request after an idle period can take ~20s or more while the instance
 * spins back up. Every page here loads its data client-side, which means that
 * wait would otherwise render as empty grids and blank counts - indistinguishable
 * from a broken site, and the single most common reason this deployment gets
 * reported as "missing features".
 *
 * So: ping the API on first load and, only if it doesn't answer promptly, say
 * plainly what's happening. A warm API never shows this at all.
 */
export function ServerWakeNotice() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [visible, setVisible] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;

    const showTimer = setTimeout(() => {
      if (!cancelled) setVisible(true);
    }, SHOW_AFTER_MS);

    const ticker = setInterval(() => {
      if (!cancelled) setElapsedMs(Date.now() - startedAt.current);
    }, 500);

    async function poll() {
      while (!cancelled) {
        try {
          const res = await fetch(HEALTH_URL, { cache: "no-store" });
          if (res.ok) {
            if (!cancelled) setPhase("ready");
            return;
          }
        } catch {
          // Still asleep, or the network dropped - either way, keep waiting.
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }

    void poll();

    return () => {
      cancelled = true;
      clearTimeout(showTimer);
      clearInterval(ticker);
    };
  }, []);

  if (phase === "ready" || !visible || dismissed) return null;

  const seconds = Math.floor(elapsedMs / 1000);
  const isSlow = elapsedMs > SLOW_AFTER_MS;
  const canDismiss = elapsedMs > DISMISSIBLE_AFTER_MS;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-md rounded-md bg-white p-8 text-center shadow-card">
        <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
          <Loader2 className="absolute inset-0 h-16 w-16 animate-spin text-brand-200" aria-hidden="true" />
          <ServerCog className="h-7 w-7 text-brand-500" aria-hidden="true" />
        </div>

        <h2 className="text-lg font-bold text-slate-900">Waking up the server</h2>

        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {isSlow
            ? "This is taking longer than usual, but it hasn't failed - the server is still starting up. Thanks for your patience."
            : "The demo API sleeps when it hasn't been used for a while, so the first visit takes a few seconds to spin it back up."}
        </p>

        <p className="mt-4 text-xs font-medium text-slate-400">
          {seconds}s elapsed{!isSlow && " — this usually takes about 20–30 seconds"}
        </p>

        {canDismiss && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="mt-5 text-xs font-semibold text-brand-600 underline underline-offset-2 transition-colors hover:text-brand-700"
          >
            Browse anyway
          </button>
        )}
      </div>
    </div>
  );
}
