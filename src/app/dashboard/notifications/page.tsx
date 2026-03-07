"use client"

import { useEffect, useState } from "react"
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/AuthContext"
import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Button from "@/components/ui/Button"
import Link from "next/link"

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    if (!user) return

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
      setLoading(false)
    })

    return () => unsub()
  }, [user])

  const markAsRead = async (notificationId: string) => {
    await updateDoc(doc(db, "notifications", notificationId), { read: true })
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read)
    for (const n of unread) {
      await markAsRead(n.id)
    }
  }

  const totalPages = Math.ceil(notifications.length / itemsPerPage)
  const paginatedNotifications = notifications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (loading) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-gray-50">
          <AuthNavbar />
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="animate-pulse">Loading notifications...</div>
          </div>
        </div>
      </RequireAuth>
    )
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gray-50">
        <AuthNavbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Notifications</h1>
            {notifications.some(n => !n.read) && (
              <Button onClick={markAllAsRead}>
                Mark All as Read
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No notifications yet</p>
                </CardContent>
              </Card>
            ) : (
              paginatedNotifications.map((notification) => (
                <Card key={notification.id} className={`cursor-pointer hover:shadow-md transition ${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{notification.title}</h3>
                          {!notification.read && <Badge variant="secondary">New</Badge>}
                        </div>
                        <p className="text-gray-700 mb-2">{notification.message}</p>
                        <p className="text-sm text-gray-500">
                          {notification.createdAt?.toDate().toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {notification.link && (
                          <Button variant="outline">
                            <Link href={notification.link}>
                              View
                            </Link>
                          </Button>
                        )}
                        {!notification.read && (
                          <Button variant="outline" onClick={() => markAsRead(notification.id)}>
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {notifications.length > itemsPerPage && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  )
}