"use client"

import { useEffect, useState } from "react"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/AuthContext"
import { Bell } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

export default function NotificationBell() {

  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {

    if (!user?.uid) {
      setNotifications([])
      return
    }

    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      )

      const unsub = onSnapshot(q, (snap) => {
        const data = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setNotifications(data)
      }, (error: any) => {
        // Silently fail if permission denied - don't crash the page
        console.warn("Notifications unavailable:", error?.message)
        setNotifications([])
      })

      return () => unsub()
    } catch (error) {
      console.error("Error setting up notifications listener:", error)
      setNotifications([])
      return undefined
    }

  }, [user?.uid])

  const unread = notifications.filter(n => !n.read).length

  const [dropdownOpen, setDropdownOpen] = useState(false)

  const markAsRead = async (id: string) => {
    // Call API to mark as read
    await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    })
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        animate={unread > 0 ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: unread > 0 ? Infinity : 0, duration: 1 }}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
      >
        <Bell size={20} className="text-gray-700" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unread}
          </span>
        )}
      </motion.button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-bold text-lg mb-2">Notifications</h3>
            {notifications.length === 0 ? (
              <p className="text-gray-500">No notifications</p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`p-3 mb-2 rounded-lg border cursor-pointer hover:bg-gray-50 ${!n.read ? "bg-blue-50 border-blue-200" : "bg-white"}`}
                  onClick={() => {
                    if (!n.read) markAsRead(n.id)
                    if (n.link) window.location.href = n.link
                    setDropdownOpen(false)
                  }}
                >
                  <p className="font-semibold">{n.title}</p>
                  <p className="text-sm text-gray-600">{n.message}</p>
                  {!n.read && <span className="text-xs text-blue-600">New</span>}
                </div>
              ))
            )}
            <Link href="/dashboard/notifications" className="block text-center text-blue-600 mt-2" onClick={() => setDropdownOpen(false)}>
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}