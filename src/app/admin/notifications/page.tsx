import { getAdminDb } from "@/lib/firebaseAdmin"
import { Card, CardContent } from "@/components/ui/card"
export const dynamic = "force-dynamic"

async function getNotifications() {
  const db = getAdminDb()
  const snap = await db.collection("notifications").get()
  return snap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

export default async function NotificationsPage() {
  const notifications: any = await getNotifications()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Notifications</h1>
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="p-8 text-center text-gray-600">
                No notifications
              </CardContent>
            </Card>
          ) : (
            notifications.map((n: any) => (
              <Card key={n.id} className="rounded-xl hover:shadow-md transition">
                <CardContent className="p-6 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-extrabold text-gray-900 mb-1">
                      {n.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{n.message}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 font-semibold">Type</span>
                        <p className="text-gray-900">{n.type}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold">User</span>
                        <p className="text-gray-900">{n.userId}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold">Read</span>
                        <p className="text-gray-900">{n.read ? "Yes" : "No"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}