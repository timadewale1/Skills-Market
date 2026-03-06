import Link from "next/link"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
export const dynamic = "force-dynamic"

async function getTalentWorkspaces(talentUid: string) {
  const db = getAdminDb()
  // Workspaces are in subcollections under gigs
  const gigsSnap = await db.collection("gigs").get()
  const workspaces: any[] = []
  for (const gigDoc of gigsSnap.docs) {
    const wsSnap = await gigDoc.ref.collection("workspaces").where("talentUid", "==", talentUid).get()
    wsSnap.docs.forEach((doc: any) => {
      workspaces.push({
        id: doc.id,
        gigId: gigDoc.id,
        gigTitle: gigDoc.data().title,
        ...doc.data(),
      })
    })
  }
  return workspaces
}

async function getTalentName(talentUid: string) {
  const db = getAdminDb()
  const snap = await db.collection("publicProfiles").doc(talentUid).get()
  return snap.data()?.fullName || talentUid
}

async function getClientName(clientUid: string) {
  const db = getAdminDb()
  const snap = await db.collection("publicProfiles").doc(clientUid).get()
  return snap.data()?.fullName || clientUid
}

function statusBadge(status: string) {
  if (status?.includes?.("active")) return <Badge className="bg-green-100 text-green-900">Active</Badge>
  if (status?.includes?.("completed")) return <Badge className="bg-blue-100 text-blue-900">Completed</Badge>
  if (status?.includes?.("waiting")) return <Badge className="bg-yellow-100 text-yellow-900">Waiting Payment</Badge>
  if (status?.includes?.("paused")) return <Badge className="bg-gray-100 text-gray-900">Paused</Badge>
  return <Badge>{status}</Badge>
}

export default async function TalentWorkspacesPage({ params }: { params: { uid: string } }) {
  const { uid } = params
  const workspaces: any = await getTalentWorkspaces(uid)
  const talentName = await getTalentName(uid)
  
  // Fetch client names for all workspaces
  const wsWithClients = await Promise.all(
    workspaces.map(async (ws: any) => ({
      ...ws,
      clientName: await getClientName(ws.clientUid),
    }))
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href={`/admin/talents/${uid}`} className="text-blue-600 hover:underline mb-6 inline-block">
          ← Back to {talentName}
        </Link>

        <h1 className="text-3xl font-extrabold text-gray-900">Workspaces with {talentName}</h1>
        <p className="text-gray-600 mt-2">All active and completed workspaces for this talent</p>

        <div className="mt-8 space-y-4">
          {wsWithClients.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="p-8 text-center text-gray-600">
                No workspaces found
              </CardContent>
            </Card>
          ) : (
            wsWithClients.map((ws: any) => (
              <Card key={ws.id} className="rounded-xl hover:shadow-md transition">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-3">
                        <h3 className="text-lg font-extrabold text-gray-900">
                          {ws.gigTitle}
                        </h3>
                        {statusBadge(ws.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 font-semibold">Gig</span>
                          <Link href={`/admin/gigs/${ws.gigId}`} className="text-blue-600 hover:underline block">
                            {ws.gigTitle}
                          </Link>
                        </div>
                        <div>
                          <span className="text-gray-500 font-semibold">Client</span>
                          <Link href={`/admin/clients/${ws.clientUid}`} className="text-blue-600 hover:underline block">
                            {ws.clientName}
                          </Link>
                        </div>
                        <div>
                          <span className="text-gray-500 font-semibold">Status</span>
                          <p className="text-gray-900 font-semibold">{ws.status}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-semibold">Created</span>
                          <p className="text-gray-900 font-semibold">
                            {ws.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-sm">
                        Review
                      </button>
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