import { getAdminDb } from "@/lib/firebaseAdmin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Bell, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

async function getNotifications() {
  const db = getAdminDb()
  const snap = await db.collection("notifications").orderBy("createdAt", "desc").limit(100).get()
  return snap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

function getNotificationColor(type: string): string {
  if (type.includes("proposal")) return "border-l-blue-500"
  if (type.includes("agreement")) return "border-l-purple-500"
  if (type.includes("workspace")) return "border-l-green-500"
  if (type.includes("payout")) return "border-l-yellow-500"
  if (type.includes("withdrawal")) return "border-l-orange-500"
  if (type.includes("kyc")) return "border-l-red-500"
  if (type.includes("user")) return "border-l-indigo-500"
  return "border-l-gray-400"
}

function getNotificationIcon(type: string): string {
  if (type.includes("proposal")) return "📋"
  if (type.includes("agreement")) return "📝"
  if (type.includes("workspace")) return "🚀"
  if (type.includes("payout")) return "💰"
  if (type.includes("withdrawal")) return "🏦"
  if (type.includes("kyc")) return "✅"
  if (type.includes("user")) return "👤"
  return "🔔"
}

export default async function AdminNotificationsPage() {
  const notifications: any = await getNotifications()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bell size={28} className="text-[var(--primary)]" />
            <h1 className="text-4xl font-extrabold text-gray-900">
              Admin Notifications
            </h1>
          </div>
          <p className="text-gray-600">
            {notifications.length === 0
              ? "No notifications yet"
              : `${notifications.length} notification${notifications.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Notifications Grid */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card className="rounded-2xl border-2 border-dashed">
              <CardContent className="p-12 text-center">
                <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-semibold text-gray-500">
                  No notifications yet
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Admin alerts will appear here when users take actions that require your attention.
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((n: any) => (
              <Link key={n.id} href={n.link || "/admin/notifications"}>
                <Card
                  className={`rounded-2xl hover:shadow-lg transition cursor-pointer border-l-4 ${getNotificationColor(n.type)}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Icon + Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0 mt-1">
                            {getNotificationIcon(n.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-extrabold text-gray-900 mb-1">
                              {n.title}
                            </h3>
                            <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                              {n.message}
                            </p>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-gray-500 font-semibold block">Type</span>
                                <p className="text-gray-800">
                                  {n.type.replace("admin:", "").replace(/_/g, " ")}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500 font-semibold block">Status</span>
                                <p className={`font-semibold ${n.read ? "text-gray-600" : "text-blue-600"}`}>
                                  {n.read ? "Read" : "Unread"}
                                </p>
                              </div>
                              {n.createdAt && (
                                <div className="col-span-2">
                                  <span className="text-gray-500 font-semibold block">Time</span>
                                  <p className="text-gray-600">
                                    {new Date(n.createdAt.toDate()).toLocaleString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Arrow + Read indicator */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!n.read && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" title="Unread" />
                        )}
                        <ArrowRight size={20} className="text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        {/* Footer Help Text */}
        {notifications.length > 0 && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-900">
              💡 <strong>Tip:</strong> Click any notification to view details. Unread notifications are marked with a blue dot.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}