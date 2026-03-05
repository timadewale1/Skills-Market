import { getAdminDb } from "@/lib/firebaseAdmin"
export const dynamic = "force-dynamic"

async function getGigs() {
  const db = getAdminDb()
  const snap = await db.collection("gigs").get()
  return snap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

export default async function GigsPage() {
  // TODO: Add proper auth middleware for admin routes
  const gigs: any = await getGigs()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Gigs</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Title</th>
            <th className="p-2">Client</th>
            <th className="p-2">Status</th>
            <th className="p-2">Budget</th>
            <th className="p-2">Created At</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {gigs.map((g: any) => (
            <tr key={g.id} className="border-t">
              <td className="p-2">{g.title}</td>
              <td className="p-2">{g.clientUid}</td>
              <td className="p-2">{g.status}</td>
              <td className="p-2">{g.budgetType === "fixed" ? `₦${g.fixedBudget}` : `₦${g.hourlyRate}/hr`}</td>
              <td className="p-2">{g.createdAt?.toDate?.().toLocaleDateString() || "N/A"}</td>
              <td className="p-2">
                <button className="text-blue-600 hover:underline">View</button>
                <button className="text-red-600 hover:underline ml-2">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}