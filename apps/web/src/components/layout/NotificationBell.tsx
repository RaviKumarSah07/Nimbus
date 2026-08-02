"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import clsx from "clsx";
import {
  useGetUnreadNotificationCountQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "../../store/api/notificationsApi";
import { useAppSelector } from "../../store/hooks";
import { formatRelativeTime } from "../../lib/formatRelativeTime";
import { Spinner } from "../ui/Spinner";

// RealtimeProvider pushes an instant invalidation on every new notification,
// so this poll is just a fallback for the window between page load and the
// socket connecting, or a dropped connection - not the primary mechanism
// anymore, hence the long interval.
const POLL_INTERVAL_MS = 90_000;

/**
 * Lives once in the sitewide Navbar (root layout), so it's already present
 * on admin routes too - the admin console doesn't get its own copy.
 */
export function NotificationBell() {
  const status = useAppSelector((state) => state.auth.status);
  const isAuthed = status === "authenticated";
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: unreadCount = 0 } = useGetUnreadNotificationCountQuery(undefined, {
    skip: !isAuthed,
    pollingInterval: POLL_INTERVAL_MS,
  });
  const { data, isLoading } = useGetNotificationsQuery({ limit: 10 }, { skip: !isAuthed || !open });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthed) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        className="relative flex items-center rounded-md p-2 text-white hover:bg-white/10"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-900">Notifications</h2>
            {!!data?.unreadCount && (
              <button
                type="button"
                onClick={() => markAllRead()}
                disabled={isMarkingAll}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-6">
                <Spinner label="Loading notifications" />
              </div>
            ) : !data || data.items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">You&apos;re all caught up.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.items.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.link ?? "#"}
                      onClick={() => {
                        setOpen(false);
                        if (!n.isRead) markRead(n.id);
                      }}
                      className={clsx("flex gap-2 px-4 py-3 text-sm hover:bg-slate-50", !n.isRead && "bg-brand-50/50")}
                    >
                      <span
                        className={clsx("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.isRead ? "bg-transparent" : "bg-brand-600")}
                        aria-hidden="true"
                      />
                      <span className="flex-1">
                        <span className="block font-medium text-slate-900">{n.title}</span>
                        <span className="block text-slate-600">{n.message}</span>
                        <span className="mt-0.5 block text-xs text-slate-400">{formatRelativeTime(n.createdAt)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
