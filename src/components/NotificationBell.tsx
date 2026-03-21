"use client"

import { useEffect, useState } from "react"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { Bell } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/AuthContext"
import {
  formatNotificationType,
  getNotificationMeta,
  isAdminNotification,
} from "@/lib/notifications/presentation"
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/client"

export default function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([])
      return
    }

    try {
      const q = query(collection(db, "notifications"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))
      const unsub = onSnapshot(
        q,
        (snap) => {
          const data = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          setNotifications(data.filter((item: any) => !isAdminNotification(item.type)))
        },
        (error: any) => {
          console.warn("Notifications unavailable:", error?.message)
          setNotifications([])
        }
      )

      return () => unsub()
    } catch (error) {
      console.error("Error setting up notifications listener:", error)
      setNotifications([])
      return undefined
    }
  }, [user?.uid])

  const unread = notifications.filter((n) => !n.read).length

  const markAsRead = async (id: string) => {
    await markNotificationRead(id)
  }

  return (
    <div className="relative inline-block">
      <motion.button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        animate={unread > 0 ? { scale: [1, 1.08, 1] } : {}}
        transition={{ repeat: unread > 0 ? Infinity : 0, duration: 1.2 }}
        className="relative rounded-full p-2 transition hover:bg-gray-100"
      >
        <Bell size={20} className="text-gray-700" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </motion.button>

      {dropdownOpen ? (
        <div className="fixed sm:absolute left-0 right-0 top-auto sm:left-auto sm:right-0 z-50 m-2 sm:m-0 sm:mt-2 w-[calc(100%-1rem)] sm:w-96 overflow-y-auto rounded-[1.5rem] border bg-white shadow-xl" style={{ maxHeight: '80vh' }}>
          <div className="sticky top-0 border-b bg-white px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-extrabold text-gray-900">Notifications</div>
                <div className="text-xs text-gray-500">{unread} unread</div>
              </div>
              {unread > 0 ? (
                <button
                  type="button"
                  onClick={() => void markAllNotificationsRead()}
                  className="text-xs font-semibold text-[var(--primary)] transition hover:text-orange-700"
                >
                  Mark all read
                </button>
              ) : null}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Bell size={32} className="mx-auto mb-2 text-gray-300" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 3).map((n) => {
                const meta = getNotificationMeta(n.type)
                const Icon = meta.Icon
                return (
                  <div
                    key={n.id}
                    className={`cursor-pointer border-l-4 px-5 py-4 transition hover:bg-gray-50 ${n.read ? "border-l-transparent" : meta.borderClass}`}
                    onClick={() => {
                      if (!n.read) void markAsRead(n.id)
                      if (n.link) window.location.href = n.link
                      setDropdownOpen(false)
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${meta.chipClass}`}>
                            <Icon size={12} />
                            {meta.label}
                          </div>
                          {!n.read ? <span className="h-2 w-2 rounded-full bg-blue-500" /> : null}
                        </div>
                        <div className="mt-2 font-semibold text-gray-900">{n.title}</div>
                        <div className="mt-1 line-clamp-2 text-sm text-gray-600">{n.message}</div>
                        <div className="mt-2 text-xs text-gray-400">
                          {formatNotificationType(n.type)} · {n.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="sticky bottom-0 border-t bg-white px-5 py-3">
            <Link
              href="/dashboard/notifications"
              className="block text-center text-sm font-semibold text-[var(--primary)] transition hover:text-orange-700"
              onClick={() => setDropdownOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
