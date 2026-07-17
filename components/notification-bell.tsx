"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { markNotificationsRead } from "@/lib/actions/notifications";
import { useT } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface AppNotification {
  id: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: AppNotification[];
  unreadCount: number;
}) {
  const t = useT();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next && unreadCount > 0) {
      startTransition(async () => {
        await markNotificationsRead();
        router.refresh();
      });
    }
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[oklch(0.63_0.21_355)] text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-2.5 text-sm font-semibold">
          {t.notif.title}
        </div>
        {notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {t.notif.empty}
          </p>
        ) : (
          <ul className="max-h-96 divide-y overflow-y-auto">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`px-4 py-3 ${n.read_at ? "" : "bg-accent/40"}`}
              >
                <p className="text-sm font-medium">{n.title}</p>
                {n.body && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {n.body}
                  </p>
                )}
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {relTime(n.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
