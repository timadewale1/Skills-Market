import { getAdminDb } from "@/lib/firebaseAdmin"
export const dynamic = "force-dynamic"

async function getTalents() {
  const db = getAdminDb()
  const snap = await db.collection("users").where("role", "==", "talent").get()
  const talents = []
  for (const doc of snap.docs) {
    const data = doc.data()
    const profileSnap = await db.collection("publicProfiles").doc(doc.id).get()
    const profile = profileSnap.exists ? profileSnap.data() : {}
    talents.push({
      id: doc.id,
      ...data,
      profile,
    })
  }
  return talents
}

export default async function TalentsPage() {
  // TODO: Add proper auth middleware for admin routes
  const talents: any = await getTalents()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Talents</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Slug</th>
            <th className="p-2">Verified</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {talents.map((t: any) => (
            <tr key={t.id} className="border-t">
              <td className="p-2">{t.profile?.fullName || t.name}</td>
              <td className="p-2">{t.email}</td>
              <td className="p-2">{t.profile?.slug}</td>
              <td className="p-2">{t.profile?.verification?.status || "Not Submitted"}</td>
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