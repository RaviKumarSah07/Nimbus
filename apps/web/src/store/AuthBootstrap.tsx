"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch } from "./hooks";
import { useRefreshMutation } from "./api/authApi";
import { setBootstrapping, setCredentials, clearCredentials } from "./authSlice";

/**
 * The access token only lives in memory (Redux state), never localStorage,
 * to keep it out of reach of XSS. That means a hard page reload loses it -
 * so on first mount we silently exchange the httpOnly refresh cookie for a
 * fresh access token. If there's no valid cookie, this just resolves to a
 * 401 and the app renders as a guest, which is the correct default anyway.
 */
export function AuthBootstrap() {
  const dispatch = useAppDispatch();
  const [refresh] = useRefreshMutation();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    dispatch(setBootstrapping());
    refresh()
      .unwrap()
      .then((payload) => {
        dispatch(setCredentials(payload));
      })
      .catch(() => {
        dispatch(clearCredentials());
      });
  }, [dispatch, refresh]);

  return null;
}
