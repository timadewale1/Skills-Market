import { getAdminDb } from "@/lib/firebaseAdmin"
export const dynamic = "force-dynamic"

async function getThreads() {
  const db = getAdminDb()
  const snap = await db.collection("threads").get()
  return snap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

export default async function MessagesPage() {
  // TODO: Add proper auth middleware for admin routes
  const threads: any = await getThreads()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Messages/Threads</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">ID</th>
            <th className="p-2">Client</th>
            <th className="p-2">Talent</th>
            <th className="p-2">Gig</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {threads.map((t: any) => (
            <tr key={t.id} className="border-t">
              <td className="p-2">{t.id}</td>
              <td className="p-2">{t.clientName}</td>
              <td className="p-2">{t.talentName}</td>
              <td className="p-2">{t.gigTitle}</td>
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