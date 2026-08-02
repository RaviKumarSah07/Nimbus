"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "./makeStore";
import { AuthBootstrap } from "./AuthBootstrap";
import { RealtimeProvider } from "./RealtimeProvider";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current}>
      <AuthBootstrap />
      <RealtimeProvider />
      {children}
    </Provider>
  );
}
