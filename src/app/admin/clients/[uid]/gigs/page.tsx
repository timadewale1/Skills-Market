import Link from "next/link"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
export const dynamic = "force-dynamic"

async function getClientGigs(clientUid: string) {
  const db = getAdminDb()
  const snap = await db.collection("gigs").where("clientUid", "==", clientUid).orderBy("createdAt", "desc").get()
  return snap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

async function getClientName(clientUid: string) {
  const db = getAdminDb()
  const snap = await db.collection("publicProfiles").doc(clientUid).get()
  return snap.data()?.fullName || snap.data()?.businessName || clientUid
}

function money(n?: number | null) {
  if (n === null || n === undefined) return "—"
  return `₦${Number(n).toLocaleString()}`
}

function statusBadge(status: string) {
  if (status === "open") return <Badge className="bg-green-100 text-green-800">Open</Badge>
  if (status === "closed") return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>
  return <Badge>{status}</Badge>
}

export default async function ClientGigsPage({ params }: { params: { uid: string } }) {
  const { uid } = params
  const gigs: any = await getClientGigs(uid)
  const clientName = await getClientName(uid)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href={`/admin/clients/${uid}`} className="text-blue-600 hover:underline mb-6 inline-block">
          ← Back to {clientName}
        </Link>

        <h1 className="text-3xl font-extrabold text-gray-900">Gigs by {clientName}</h1>
        <p className="text-gray-600 mt-2">All gigs posted by this client</p>

        <div className="mt-8 space-y-4">
          {gigs.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="p-8 text-center text-gray-600">
                No gigs found
              </CardContent>
            </Card>
          ) : (
            gigs.map((g: any) => (
              <Card key={g.id} className="rounded-xl hover:shadow-md transition">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-extrabold text-gray-900 truncate">{g.title}</h3>
                        {statusBadge(g.status || "open")}
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{g.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                        <div>
                          <span className="text-gray-500 font-semibold">Budget</span>
                          <p className="text-gray-900 font-semibold">
                            {g.budgetType === "fixed" ? `₦${money(g.fixedBudget)}` : `₦${money(g.hourlyRate)}/hr`}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-semibold">Hires Needed</span>
                          <p className="text-gray-900 font-semibold">{g.hiresNeeded || 1}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-semibold">Duration</span>
                          <p className="text-gray-900 font-semibold">{g.duration || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-semibold">Created</span>
                          <p className="text-gray-900 font-semibold">
                            {g.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/gigs/${g.id}`}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-sm"
                      >
                        View
                      </Link>
                      <button className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition text-sm">
                        Delete
                      </button>
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