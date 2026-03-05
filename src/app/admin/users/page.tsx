import { getAdminDb } from "@/lib/firebaseAdmin"


async function getUsers() {
  const db = getAdminDb()
  const snap = await db.collection("users").get()
  return snap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

export default async function UsersPage() {
  // TODO: Add proper auth middleware for admin routes
  const users: any = await getUsers()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">ID</th>
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Role</th>
            <th className="p-2">Created At</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u: any) => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.id}</td>
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.role}</td>
              <td className="p-2">{u.createdAt?.toDate?.().toLocaleDateString() || "N/A"}</td>
              <td className="p-2">
                <button className="text-blue-600 hover:underline">Edit</button>
                <button className="text-red-600 hover:underline ml-2">Suspend</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}