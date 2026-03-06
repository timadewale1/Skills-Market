"use client"

import { useEffect, useState } from "react"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/AuthContext"
import { Bell } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

export default function AdminNotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setNotifications(data)
    })

    return () => unsub()
  }, [user])

  const unread = notifications.filter((n) => !n.read).length

  const [dropdownOpen, setDropdownOpen] = useState(false)

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      })
    } catch (err) {
      console.error("mark-read error:", err)
    }
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        animate={unread > 0 ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: unread > 0 ? Infinity : 0, duration: 1 }}
        className="relative p-2 rounded-full hover:bg-orange-100 transition"
        title="Admin Notifications"
      >
        <Bell size={20} className="text-[var(--primary)]" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </motion.button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b sticky top-0 bg-white">
            <h3 className="font-bold text-lg text-gray-900">Admin Notifications</h3>
            <span className="text-xs text-gray-500">{unread} unread</span>
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Bell size={32} className="mx-auto mb-2 text-gray-400" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 15).map((n) => (
                <div
                  key={n.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition border-l-4 ${
                    !n.read
                      ? "bg-blue-50 border-l-[var(--primary)]"
                      : "border-l-transparent"
                  }`}
                  onClick={() => {
                    if (!n.read) markAsRead(n.id)
                    if (n.link) window.location.href = n.link
                    setDropdownOpen(false)
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {n.createdAt
                          ? new Date(n.createdAt.toDate()).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="inline-block w-2 h-2 rounded-full bg-[var(--primary)] flex-shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 border-t sticky bottom-0 bg-white">
            <Link
              href="/admin/notifications"
              className="block text-center text-sm font-semibold text-[var(--primary)] hover:text-orange-700 transition"
              onClick={() => setDropdownOpen(false)}
            >
              View All Notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
