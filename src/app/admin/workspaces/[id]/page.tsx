import Link from "next/link"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
export const dynamic = "force-dynamic"

async function getWorkspace(id: string) {
  const db = getAdminDb()
  // Workspaces are nested under gigs
  const gigsSnap = await db.collection("gigs").get()
  for (const gigDoc of gigsSnap.docs) {
    const wsSnap = await gigDoc.ref.collection("workspaces").doc(id).get()
    if (wsSnap.exists) {
      return {
        id: wsSnap.id,
        gigId: gigDoc.id,
        gigTitle: gigDoc.data().title,
        ...wsSnap.data(),
      }
    }
  }
  return null
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

export default async function WorkspaceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const workspace: any = await getWorkspace(id)

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-gray-600">Workspace not found</div>
        </div>
      </div>
    )
  }

  const talentName = await getTalentName(workspace.talentUid)
  const clientName = await getClientName(workspace.clientUid)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href={`/admin/gigs/${workspace.gigId}/workspaces`} className="text-blue-600 hover:underline mb-6 inline-block">
          ← Back to Gig Workspaces
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <Card className="rounded-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-extrabold text-gray-900">
                      {workspace.gigTitle}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-2">
                      Workspace ID: {id}
                    </p>
                  </div>
                  {statusBadge(workspace.status)}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="text-gray-500 text-sm font-semibold uppercase">Created</span>
                    <p className="text-gray-900 font-semibold mt-1">
                      {workspace.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm font-semibold uppercase">Status</span>
                    <p className="text-gray-900 font-semibold mt-1 capitalize">{workspace.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Parties Card */}
            <Card className="rounded-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-xl">
                <CardTitle className="text-lg font-extrabold text-gray-900">Parties</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Client */}
                <div className="pb-6 border-b">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Client</h3>
                  <Link
                    href={`/admin/clients/${workspace.clientUid}`}
                    className="text-blue-600 hover:underline font-semibold text-lg"
                  >
                    {clientName}
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">{workspace.clientUid}</p>
                </div>

                {/* Talent */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Talent</h3>
                  <Link
                    href={`/admin/talents/${workspace.talentUid}`}
                    className="text-blue-600 hover:underline font-semibold text-lg"
                  >
                    {talentName}
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">{workspace.talentUid}</p>
                </div>
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card className="rounded-xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-xl">
                <CardTitle className="text-lg font-extrabold text-gray-900">Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {workspace.hourlyRate && (
                    <div className="pb-4 border-b">
                      <span className="text-gray-500 text-sm font-semibold uppercase">Hourly Rate</span>
                      <p className="text-gray-900 font-semibold mt-1">
                        ₦{Number(workspace.hourlyRate).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {workspace.milestones && (
                    <div className="pb-4 border-b">
                      <span className="text-gray-500 text-sm font-semibold uppercase">Milestones</span>
                      <p className="text-gray-900 font-semibold mt-1">{workspace.milestones?.length || 0} milestones</p>
                    </div>
                  )}
                  {workspace.description && (
                    <div>
                      <span className="text-gray-500 text-sm font-semibold uppercase">Notes</span>
                      <p className="text-gray-900 mt-1">{workspace.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <Card className="rounded-xl">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-t-xl">
                <CardTitle className="text-lg font-extrabold text-gray-900">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Link
                  href={`/admin/gigs/${workspace.gigId}`}
                  className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 transition text-blue-600 font-semibold"
                >
                  → View Gig
                </Link>
                <Link
                  href={`/admin/clients/${workspace.clientUid}`}
                  className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 transition text-blue-600 font-semibold"
                >
                  → View Client
                </Link>
                <Link
                  href={`/admin/talents/${workspace.talentUid}`}
                  className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 transition text-blue-600 font-semibold"
                >
                  → View Talent
                </Link>
              </CardContent>
            </Card>

            {/* Admin Actions */}
            <Card className="rounded-xl border-red-200">
              <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 rounded-t-xl">
                <CardTitle className="text-lg font-extrabold text-gray-900">Admin Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <button className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
                  Edit Workspace
                </button>
                <button className="w-full px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition">
                  Delete Workspace
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}