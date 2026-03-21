"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore"
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Button from "@/components/ui/Button"
import {
  formatNotificationType,
  getNotificationCategory,
  getNotificationMeta,
  isAdminNotification,
  notificationCategoryTabs,
} from "@/lib/notifications/presentation"
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/client"

type NotificationItem = {
  id: string
  type?: string
  title?: string
  message?: string
  link?: string
  read?: boolean
  createdAt?: any
}

export default function NotificationsFeed({
  scope,
  itemsPerPage = 8,
}: {
  scope: "admin" | "user"
  itemsPerPage?: number
}) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [category, setCategory] = useState("all")

  useEffect(() => {
    if (!user?.uid) return

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as NotificationItem[]

        setNotifications(
          data.filter((item) =>
            scope === "admin" ? isAdminNotification(item.type) : !isAdminNotification(item.type)
          )
        )
        setLoading(false)
      },
      () => {
        setNotifications([])
        setLoading(false)
      }
    )

    return () => unsub()
  }, [scope, user?.uid])

  const visibleNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (category === "all") return true
      return getNotificationCategory(notification.type) === category
    })
  }, [category, notifications])

  const unreadCount = visibleNotifications.filter((notification) => !notification.read).length
  const totalPages = Math.max(1, Math.ceil(visibleNotifications.length / itemsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedNotifications = visibleNotifications.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [category])

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id)
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
  }

  if (loading) {
    return (
      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="p-8 text-gray-500">Loading notifications...</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {notificationCategoryTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setCategory(tab.key)}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    category === tab.key
                      ? "border-orange-500 bg-orange-50 text-[var(--primary)]"
                      : "text-gray-700 hover:border-orange-200 hover:bg-orange-50",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {notifications.some((notification) => !notification.read) ? (
              <Button onClick={handleMarkAllRead} className="inline-flex items-center gap-2 rounded-full px-4 py-2">
                <CheckCheck size={16} />
                Mark all as read
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className="bg-orange-50 text-[var(--primary)] hover:bg-orange-50">
              {visibleNotifications.length} notifications
            </Badge>
            <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">
              {unreadCount} unread
            </Badge>
            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
              {scope === "admin" ? "Admin scope" : "User scope"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {visibleNotifications.length === 0 ? (
        <Card className="rounded-[1.75rem] border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Bell size={44} className="mx-auto text-gray-300" />
            <div className="mt-4 text-lg font-extrabold text-gray-900">No notifications yet</div>
            <p className="mt-2 text-sm text-gray-600">
              {scope === "admin"
                ? "Admin alerts will appear here when marketplace activity needs review."
                : "Updates about your gigs, messages, workspaces, and payments will appear here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        paginatedNotifications.map((notification) => {
          const meta = getNotificationMeta(notification.type)
          const Icon = meta.Icon

          return (
            <Card
              key={notification.id}
              className={`rounded-[1.75rem] border-0 border-l-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${meta.borderClass}`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${meta.chipClass}`}>
                        <Icon size={14} />
                        {meta.label}
                      </div>
                      {!notification.read ? (
                        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">New</Badge>
                      ) : null}
                    </div>

                    <h2 className="mt-3 text-lg font-extrabold text-gray-900">
                      {notification.title || "Notification"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {notification.message || "No message available."}
                    </p>

                    <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
                      <div>
                        <div className="font-semibold text-gray-500">Type</div>
                        <div className="mt-1 text-gray-900">
                          {formatNotificationType(notification.type)}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Status</div>
                        <div className="mt-1 text-gray-900">
                          {notification.read ? "Read" : "Unread"}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Time</div>
                        <div className="mt-1 text-gray-900">
                          {notification.createdAt?.toDate?.().toLocaleString() || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {notification.link ? (
                      <Link
                        href={notification.link}
                        onClick={() => {
                          if (!notification.read) void handleMarkRead(notification.id)
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                      >
                        <ExternalLink size={15} />
                        View
                      </Link>
                    ) : null}
                    {!notification.read ? (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(notification.id)}
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
                      >
                        <CheckCheck size={15} />
                        Mark read
                      </button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}

      {visibleNotifications.length > itemsPerPage ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
            disabled={safePage === 1}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <div className="text-sm font-semibold text-gray-600">
            Page {safePage} of {totalPages}
          </div>
          <button
            type="button"
            onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
            disabled={safePage === totalPages}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      ) : null}
    </div>
  )
}
