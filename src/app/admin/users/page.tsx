import { getAdminDb } from "@/lib/firebaseAdmin"
import { Card, CardContent } from "@/components/ui/card"
export const dynamic = "force-dynamic"

async function getUsers() {
  const db = getAdminDb()
  const snap = await db.collection("users").get()
  return snap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

export default async function UsersPage() {
  const users: any = await getUsers()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Users</h1>
        <div className="space-y-4">
          {users.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="p-8 text-center text-gray-600">
                No users found
              </CardContent>
            </Card>
          ) : (
            users.map((u: any) => (
              <Card key={u.id} className="rounded-xl hover:shadow-md transition">
                <CardContent className="p-6 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-extrabold text-gray-900 mb-2">
                      {u.name || u.email}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 font-semibold">Email</span>
                        <p className="text-gray-900">{u.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold">Role</span>
                        <p className="text-gray-900">{u.role}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold">Created</span>
                        <p className="text-gray-900">
                          {u.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold">ID</span>
                        <p className="text-gray-900">{u.id}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-sm">
                      Edit
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition text-sm">
                      Suspend
                    </button>
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