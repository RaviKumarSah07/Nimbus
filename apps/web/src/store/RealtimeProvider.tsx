"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "./hooks";
import { baseApi } from "./api/baseApi";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";
const WS_URL = `${API_BASE_URL.replace(/^http/, "ws").replace(/\/api\/?$/, "")}/api/ws`;
const RECONNECT_DELAY_MS = 3000;

type CacheTag = Parameters<typeof baseApi.util.invalidateTags>[0][number];

/**
 * One WebSocket connection per authenticated session. The server pushes
 * tiny "these RTK Query tags are stale" signals whenever something changes
 * elsewhere - another tab, another device, an admin action, a payment
 * webhook - and this just forwards them into invalidateTags. RTK Query's
 * existing cache machinery does the rest: no parallel data path, no
 * payload shapes to keep in sync with the REST API, and every page that
 * already reads through baseApi gets this for free.
 */
export function RealtimeProvider() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const status = useAppSelector((state) => state.auth.status);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    function connect() {
      const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(accessToken!)}`);
      socketRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data as string) as { tags?: CacheTag[] };
          if (payload.tags?.length) dispatch(baseApi.util.invalidateTags(payload.tags));
        } catch {
          // Malformed frame - drop it rather than crash the handler.
        }
      };

      ws.onclose = () => {
        if (!cancelled) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    }

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [status, accessToken, dispatch]);

  return null;
}
