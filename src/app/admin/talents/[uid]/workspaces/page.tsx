import Link from "next/link"
import { getAdminDb } from "@/lib/firebaseAdmin"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

async function getTalentWorkspaces(talentUid: string) {
  const db = getAdminDb()
  const workspacesSnap = await db.collection("workspaces").where("talentUid", "==", talentUid).get()
  return workspacesSnap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  })).sort((a: any, b: any) => {
    const aTime = a.createdAt?.toMillis?.() || 0
    const bTime = b.createdAt?.toMillis?.() || 0
    return bTime - aTime
  })
}

async function getTalentName(talentUid: string) {
  const db = getAdminDb()
  const snap = await db.collection("publicProfiles").doc(talentUid).get()
  return snap.data()?.fullName || talentUid
}

async function getClientName(clientUid: string) {
  const db = getAdminDb()
  const snap = await db.collection("publicProfiles").doc(clientUid).get()
  return snap.data()?.fullName || snap.data()?.businessName || clientUid
}

function statusBadge(status?: string) {
  if (status?.includes?.("active")) return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Active</Badge>
  if (status?.includes?.("completed")) return <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">Completed</Badge>
  if (status?.includes?.("waiting")) return <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50">Waiting payment</Badge>
  if (status?.includes?.("paused")) return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Paused</Badge>
  return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">{status || "Unknown"}</Badge>
}

export default async function TalentWorkspacesPage({
  params,
}: {
  params: Promise<{ uid: string }>
}) {
  const { uid } = await params
  const workspaces: any[] = await getTalentWorkspaces(uid)
  const talentName = await getTalentName(uid)

  const workspacesWithClients = await Promise.all(
    workspaces.map(async (workspace) => ({
      ...workspace,
      clientName: await getClientName(workspace.clientUid),
    }))
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Talent operations"
        title={`Workspaces with ${talentName}`}
        description="Review the talent’s active and completed delivery records, check client pairings, and trace each workspace back to the originating gig."
        actions={
          <Link
            href={`/admin/talents/${uid}`}
            className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
          >
            Back to talent
          </Link>
        }
        stats={[
          { label: "Total workspaces", value: workspacesWithClients.length },
          { label: "Active", value: workspacesWithClients.filter((workspace) => workspace.status?.includes("active")).length },
          { label: "Completed", value: workspacesWithClients.filter((workspace) => workspace.status?.includes("completed")).length },
          { label: "Waiting", value: workspacesWithClients.filter((workspace) => workspace.status?.includes("waiting")).length },
        ]}
      />

      <div className="space-y-4">
        {workspacesWithClients.length === 0 ? (
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-10 text-center text-gray-600">No workspaces found for this talent.</CardContent>
          </Card>
        ) : (
          workspacesWithClients.map((workspace) => (
            <Card key={workspace.id} className="rounded-[1.75rem] border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-extrabold text-gray-900">
                        {(workspace.gigTitle || "Workspace") + (workspace.clientName ? ` · ${workspace.clientName}` : "")}
                      </h2>
                      {statusBadge(workspace.status)}
                    </div>

                    <div className="mt-4 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <div className="font-semibold text-gray-500">Gig</div>
                        <Link href={`/admin/gigs/${workspace.gigId}`} className="mt-1 block text-[var(--primary)]">
                          {workspace.gigTitle || workspace.gigId || "N/A"}
                        </Link>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Client</div>
                        <Link href={`/admin/clients/${workspace.clientUid}`} className="mt-1 block text-[var(--primary)]">
                          {workspace.clientName || workspace.clientUid || "N/A"}
                        </Link>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Status</div>
                        <div className="mt-1 text-gray-900">{workspace.status || "N/A"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Created</div>
                        <div className="mt-1 text-gray-900">{workspace.createdAt?.toDate?.().toLocaleDateString() || "N/A"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/workspaces/${workspace.id}`} className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]">
                      View workspace
                    </Link>
                    <Link href={`/admin/clients/${workspace.clientUid}`} className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]">
                      View client
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
