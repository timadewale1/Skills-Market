import { getAdminDb } from "@/lib/firebaseAdmin"
export const dynamic = "force-dynamic"

async function getClients() {
  const db = getAdminDb()
  const snap = await db.collection("users").where("role", "==", "client").get()
  const clients = []
  for (const doc of snap.docs) {
    const data = doc.data()
    const profileSnap = await db.collection("publicProfiles").doc(doc.id).get()
    const profile = profileSnap.exists ? profileSnap.data() : {}
    clients.push({
      id: doc.id,
      ...data,
      profile,
    })
  }
  return clients
}

export default async function ClientsPage() {
  // TODO: Add proper auth middleware for admin routes
  const clients: any = await getClients()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Clients</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Company</th>
            <th className="p-2">Verified</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c: any) => (
            <tr key={c.id} className="border-t">
              <td className="p-2">{c.profile?.fullName || c.name}</td>
              <td className="p-2">{c.email}</td>
              <td className="p-2">{c.profile?.companyName || "N/A"}</td>
              <td className="p-2">{c.profile?.verification?.status || "Not Submitted"}</td>
              <td className="p-2">
                <button className="text-blue-600 hover:underline">View Profile</button>
                <button className="text-red-600 hover:underline ml-2">Suspend</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}