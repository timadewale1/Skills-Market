import { getAdminDb } from "@/lib/firebaseAdmin"

async function getNotifications() {
  const db = getAdminDb()
  const snap = await db.collection("notifications").get()
  return snap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

export default async function NotificationsPage() {
  // TODO: Add proper auth middleware for admin routes
  const notifications: any = await getNotifications()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">User ID</th>
            <th className="p-2">Type</th>
            <th className="p-2">Title</th>
            <th className="p-2">Message</th>
            <th className="p-2">Read</th>
          </tr>
        </thead>
        <tbody>
          {notifications.map((n: any) => (
            <tr key={n.id} className="border-t">
              <td className="p-2">{n.userId}</td>
              <td className="p-2">{n.type}</td>
              <td className="p-2">{n.title}</td>
              <td className="p-2">{n.message}</td>
              <td className="p-2">{n.read ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}