import { getAdminDb } from "@/lib/firebaseAdmin"
export const dynamic = "force-dynamic"

async function getWorkspaces() {
  const db = getAdminDb()
  const snap = await db.collection("workspaces").get()
  return snap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

export default async function WorkspacesPage() {
  // TODO: Add proper auth middleware for admin routes
  const workspaces: any = await getWorkspaces()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Workspaces</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">ID</th>
            <th className="p-2">Client</th>
            <th className="p-2">Talent</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {workspaces.map((w: any) => (
            <tr key={w.id} className="border-t">
              <td className="p-2">{w.id}</td>
              <td className="p-2">{w.clientName}</td>
              <td className="p-2">{w.talentName}</td>
              <td className="p-2">{w.status}</td>
              <td className="p-2">
                <button className="text-blue-600 hover:underline">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}