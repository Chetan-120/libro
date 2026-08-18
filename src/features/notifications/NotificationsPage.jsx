import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  Inbox,
  Megaphone,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/common/Card";
import { formatDate } from "@/utils/formatters";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getToken = () =>
  localStorage.getItem("libro_token") || sessionStorage.getItem("libro_token");

const notificationMeta = {
  reservation: {
    label: "Reservation",
    icon: CheckCircle2,
    iconClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
    badgeClass: "bg-emerald-50 text-emerald-700",
  },
  due: {
    label: "Due soon",
    icon: Clock,
    iconClass: "bg-amber-50 text-amber-600 border-amber-100",
    badgeClass: "bg-amber-50 text-amber-700",
  },
  overdue: {
    label: "Overdue",
    icon: AlertTriangle,
    iconClass: "bg-rose-50 text-rose-600 border-rose-100",
    badgeClass: "bg-rose-50 text-rose-700",
  },
  announcement: {
    label: "Announcement",
    icon: Megaphone,
    iconClass: "bg-indigo-50 text-indigo-600 border-indigo-100",
    badgeClass: "bg-indigo-50 text-indigo-700",
  },
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);

  const [activeTab, setActiveTab] = useState("all");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Please login to continue.");
      }

      const response = await fetch(`${API_URL}/api/notifications/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          `Notification API returned an unexpected response (${response.status}).`,
        );
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load notifications.");
      }

      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Load notifications error:", err);

      setError(err.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter(
    (notification) => notification.isUnread,
  ).length;

  const announcementCount = notifications.filter(
    (notification) => notification.category === "announcement",
  ).length;

  const filteredNotifications = useMemo(() => {
    if (activeTab === "unread") {
      return notifications.filter((notification) => notification.isUnread);
    }

    if (activeTab === "announcement") {
      return notifications.filter(
        (notification) => notification.category === "announcement",
      );
    }

    return notifications;
  }, [notifications, activeTab]);

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) {
      toast("Everything is already marked as read.");
      return;
    }

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Please login to continue.");
      }

      const response = await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to mark notifications as read.",
        );
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isUnread: false,
        })),
      );

      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Mark all read error:", err);

      toast.error(err.message || "Unable to update notifications.");
    }
  };

  const handleMarkRead = async (id) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error("Please login to continue.");
      }

      const response = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to mark notification as read.");
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === id
            ? {
                ...notification,
                isUnread: false,
              }
            : notification,
        ),
      );
    } catch (err) {
      console.error("Mark notification read error:", err);

      toast.error(err.message || "Unable to update notification.");
    }
  };

  const handleClearAll = async () => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error("Please login to continue.");
      }

      const response = await fetch(`${API_URL}/api/notifications/my`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to clear notifications.");
      }

      setNotifications([]);

      toast.success("Notifications cleared");
    } catch (err) {
      console.error("Clear notifications error:", err);

      toast.error(err.message || "Unable to clear notifications.");
    }
  };

  return (
    <div className="mx-auto min-w-0 max-w-5xl space-y-5 pb-8">
      {/* Header */}
      <section>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Bell className="h-4 w-4" />
              </span>

              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-indigo-600">
                Library updates
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">
              Notifications
            </h1>

            <p className="mt-2 max-w-xl text-[11px] leading-5 text-slate-500 sm:text-sm">
              Stay updated with reservations, due dates, fines, and important
              library announcements.
            </p>
          </div>

          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[9px] font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[9px] font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear all
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Total notifications"
          value={notifications.length}
          icon={Bell}
          tone="indigo"
        />

        <SummaryCard
          label="Unread"
          value={unreadCount}
          icon={Clock}
          tone="amber"
        />

        <SummaryCard
          label="Announcements"
          value={announcementCount}
          icon={Megaphone}
          tone="violet"
        />
      </section>

      {/* Tabs */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm">
        <div className="flex gap-1 overflow-x-auto">
          <FilterTab
            active={activeTab === "all"}
            onClick={() => setActiveTab("all")}
          >
            All
            <Count>{notifications.length}</Count>
          </FilterTab>

          <FilterTab
            active={activeTab === "unread"}
            onClick={() => setActiveTab("unread")}
          >
            Unread
            <Count>{unreadCount}</Count>
          </FilterTab>

          <FilterTab
            active={activeTab === "announcement"}
            onClick={() => setActiveTab("announcement")}
          >
            Announcements
            <Count>{announcementCount}</Count>
          </FilterTab>
        </div>
      </section>

      {/* Notification list */}
      {loading ? (
        <Card className="flex min-h-[300px] items-center justify-center">
          <p className="text-sm font-semibold text-indigo-700">
            Loading notifications...
          </p>
        </Card>
      ) : error ? (
        <Card className="flex min-h-[300px] items-center justify-center p-8 text-center">
          <div>
            <p className="text-sm font-semibold text-rose-700">{error}</p>

            <button
              type="button"
              onClick={loadNotifications}
              className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[9px] font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              Try again
            </button>
          </div>
        </Card>
      ) : filteredNotifications.length > 0 ? (
        <section className="space-y-3">
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onMarkRead={handleMarkRead}
            />
          ))}
        </section>
      ) : (
        <EmptyState activeTab={activeTab} />
      )}

      {/* Footer */}
      {notifications.length > 0 && (
        <section className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <CheckCircle2 className="h-4 w-4" />
          </span>

          <div>
            <p className="text-[9px] font-bold text-indigo-900">
              Your library activity is up to date
            </p>

            <p className="mt-0.5 text-[8px] leading-4 text-indigo-700/60">
              New reservation, return, and announcement updates will appear
              here.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, tone }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[8px] font-medium text-slate-400">{label}</p>

          <p className="mt-2 text-xl font-bold tracking-[-0.04em] text-slate-950">
            {value}
          </p>
        </div>

        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${tones[tone]}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
}

function FilterTab({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-[9px] font-semibold transition-all",
        active
          ? "bg-slate-950 text-white shadow-sm"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Count({ children }) {
  return (
    <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[7px] font-bold">
      {children}
    </span>
  );
}

function NotificationCard({ notification, onMarkRead }) {
  const meta =
    notificationMeta[notification.category] || notificationMeta.announcement;

  const Icon = meta.icon;

  return (
    <Card
      className={[
        "group relative overflow-hidden p-4 transition-all duration-200 sm:p-5",
        notification.isUnread
          ? "border-indigo-200/80 bg-gradient-to-r from-indigo-50/70 via-white to-white shadow-sm"
          : "bg-white hover:border-slate-300",
      ].join(" ")}
    >
      {notification.isUnread && (
        <div className="absolute inset-y-0 left-0 w-1 bg-indigo-500" />
      )}

      <div className="flex items-start gap-3.5 sm:gap-4">
        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            meta.iconClass,
          ].join(" ")}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[11px] font-bold text-slate-900 sm:text-xs">
                  {notification.title}
                </h2>

                {notification.isUnread && (
                  <span className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-2 py-1 text-[7px] font-bold text-indigo-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    Unread
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span
                  className={[
                    "rounded-full px-2 py-1 text-[7px] font-semibold",
                    meta.badgeClass,
                  ].join(" ")}
                >
                  {meta.label}
                </span>

                <span className="text-[8px] text-slate-400">
                  {formatDate(notification.createdAt)}
                </span>
              </div>
            </div>

            {notification.isUnread && (
              <button
                type="button"
                onClick={() => onMarkRead(notification._id)}
                className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-2.5 text-[8px] font-semibold text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <CheckCheck className="h-3 w-3" />
                Mark read
              </button>
            )}
          </div>

          <p className="mt-3 max-w-3xl text-[9px] leading-5 text-slate-500 sm:text-[10px]">
            {notification.message}
          </p>
        </div>
      </div>
    </Card>
  );
}

function EmptyState({ activeTab }) {
  const message =
    activeTab === "unread"
      ? "There are no unread notifications right now."
      : activeTab === "announcement"
        ? "There are no library announcements available."
        : "Your notification inbox is currently empty.";

  return (
    <Card className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Inbox className="h-6 w-6" />
      </div>

      <h2 className="mt-4 text-sm font-bold text-slate-900">
        You’re all caught up
      </h2>

      <p className="mt-1 max-w-sm text-[9px] leading-5 text-slate-400">
        {message}
      </p>
    </Card>
  );
}
