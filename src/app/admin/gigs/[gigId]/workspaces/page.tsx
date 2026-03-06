import Link from "next/link"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
export const dynamic = "force-dynamic"

async function getWorkspacesForGig(gigId: string) {
  const db = getAdminDb()
  const snap = await db.collection("workspaces").where("gigId", "==", gigId).get()
  return snap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

async function getGigTitle(gigId: string) {
  const db = getAdminDb()
  const snap = await db.collection("gigs").doc(gigId).get()
  return snap.data()?.title || "Gig"
}

function statusBadge(status?: string) {
  if (status?.includes("active")) return <Badge className="bg-green-100 text-green-900">Active</Badge>
  if (status?.includes("completed")) return <Badge className="bg-blue-100 text-blue-900">Completed</Badge>
  if (status?.includes("waiting")) return <Badge className="bg-orange-100 text-orange-900">Waiting Payment</Badge>
  return <Badge className="bg-gray-100 text-gray-900">{status || "Workspace"}</Badge>
}

export default async function AdminGigWorkspacesPage({ params }: { params: { gigId: string } }) {
  const { gigId } = params
  const workspaces: any = await getWorkspacesForGig(gigId)
  const gigTitle = await getGigTitle(gigId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href={`/admin/gigs/${gigId}`} className="text-blue-600 hover:underline mb-6 inline-block">
          ← Back to {gigTitle}
        </Link>

        <h1 className="text-3xl font-extrabold text-gray-900">Workspaces for "{gigTitle}"</h1>
        <p className="text-gray-600 mt-2">Manage all active workspaces for this gig</p>

        <div className="mt-8 space-y-4">
          {workspaces.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="p-8 text-center text-gray-600">
                No workspaces found
              </CardContent>
            </Card>
          ) : (
            workspaces.map((w: any) => (
              <Card key={w.id} className="rounded-xl hover:shadow-md transition">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-3">
                        <h3 className="text-lg font-extrabold text-gray-900">{w.gigTitle || "Workspace"}</h3>
                        {statusBadge(w.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 font-semibold">Talent</span>
                          <Link href={`/admin/talents/${w.talentUid}`} className="text-blue-600 hover:underline block">
                            {w.talentName || w.talentUid}
                          </Link>
                        </div>
                        <div>
                          <span className="text-gray-500 font-semibold">Client</span>
                          <Link href={`/admin/clients/${w.clientUid}`} className="text-blue-600 hover:underline block">
                            {w.clientName || w.clientUid}
                          </Link>
                        </div>
                        <div>
                          <span className="text-gray-500 font-semibold">Status</span>
                          <p className="text-gray-900 font-semibold">{w.status || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-semibold">Created</span>
                          <p className="text-gray-900 font-semibold">
                            {w.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/workspaces/${w.id}`}
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
