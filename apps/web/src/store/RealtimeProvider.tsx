"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "./hooks";
import { baseApi } from "./api/baseApi";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

/**
 * Deliberately separate from the REST base URL. When the API is proxied
 * through this app's own origin (see API_PROXY_TARGET in next.config.mjs, which
 * exists so the auth cookie is first-party), everything else benefits - but a
 * long-lived event stream should not go through that hop, where a serverless
 * proxy is liable to buffer it or cut it off at a function timeout. SSE carries
 * its token in the query string rather than a cookie, so it has no reason to be
 * same-origin: point this straight at the API.
 */
const EVENTS_URL = `${process.env.NEXT_PUBLIC_REALTIME_BASE_URL ?? API_BASE_URL}/events`;

type CacheTag = Parameters<typeof baseApi.util.invalidateTags>[0][number];

/**
 * One Server-Sent Events connection per authenticated session. The server
 * pushes tiny "these RTK Query tags are stale" signals whenever something
 * changes elsewhere - another tab, another device, an admin action, a
 * payment webhook - and this just forwards them into invalidateTags. RTK
 * Query's existing cache machinery does the rest: no parallel data path, no
 * payload shapes to keep in sync with the REST API, and every page that
 * already reads through baseApi gets this for free.
 *
 * SSE rather than WebSocket: a plain streamed HTTP response, not a protocol
 * Upgrade, which survives budget/shared reverse proxies far more reliably -
 * confirmed live, where a WebSocket version of this worked perfectly
 * locally but failed in production through Render's free-tier edge.
 * EventSource also reconnects on its own (using the `retry:` hint the
 * server sends), so there's no hand-rolled reconnect loop to maintain here.
 */
export function RealtimeProvider() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const status = useAppSelector((state) => state.auth.status);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;

    const source = new EventSource(`${EVENTS_URL}?token=${encodeURIComponent(accessToken)}`);
    sourceRef.current = source;

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string) as { tags?: CacheTag[] };
        if (payload.tags?.length) dispatch(baseApi.util.invalidateTags(payload.tags));
      } catch {
        // Malformed frame - drop it rather than crash the handler.
      }
    };

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [status, accessToken, dispatch]);

  return null;
}
