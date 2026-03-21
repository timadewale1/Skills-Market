import Link from "next/link"
import { getAdminDb } from "@/lib/firebaseAdmin"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

async function getClientWorkspaces(clientUid: string) {
  const db = getAdminDb()
  const workspacesSnap = await db.collection("workspaces").where("clientUid", "==", clientUid).get()
  return workspacesSnap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  })).sort((a: any, b: any) => {
    const aTime = a.createdAt?.toMillis?.() || 0
    const bTime = b.createdAt?.toMillis?.() || 0
    return bTime - aTime
  })
}

async function getClientName(clientUid: string) {
  const db = getAdminDb()
  const snap = await db.collection("publicProfiles").doc(clientUid).get()
  return snap.data()?.fullName || snap.data()?.businessName || clientUid
}

function statusBadge(status?: string) {
  if (status?.includes("active")) return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Active</Badge>
  if (status?.includes("completed")) return <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">Completed</Badge>
  if (status?.includes("waiting")) return <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50">Waiting payment</Badge>
  return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">{status || "Workspace"}</Badge>
}

export default async function ClientWorkspacesPage({
  params,
}: {
  params: Promise<{ uid: string }>
}) {
  const { uid } = await params
  const workspaces: any[] = await getClientWorkspaces(uid)
  const clientName = await getClientName(uid)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Client operations"
        title={`Workspaces for ${clientName}`}
        description="Track the downstream delivery records created from this client’s gigs, including talent assignments, status progression, and linked gig context."
        actions={
          <Link
            href={`/admin/clients/${uid}`}
            className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
          >
            Back to client
          </Link>
        }
        stats={[
          { label: "Total workspaces", value: workspaces.length },
          { label: "Active", value: workspaces.filter((workspace) => workspace.status?.includes("active")).length },
          { label: "Completed", value: workspaces.filter((workspace) => workspace.status?.includes("completed")).length },
          { label: "Waiting", value: workspaces.filter((workspace) => workspace.status?.includes("waiting")).length },
        ]}
      />

      <div className="space-y-4">
        {workspaces.length === 0 ? (
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-10 text-center text-gray-600">No workspaces found for this client.</CardContent>
          </Card>
        ) : (
          workspaces.map((workspace) => (
            <Card key={workspace.id} className="rounded-[1.75rem] border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-extrabold text-gray-900">
                        {(workspace.gigTitle || "Workspace") + (workspace.talentName ? ` · ${workspace.talentName}` : "")}
                      </h2>
                      {statusBadge(workspace.status)}
                    </div>

                    <div className="mt-4 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <div className="font-semibold text-gray-500">Talent</div>
                        <Link href={`/admin/talents/${workspace.talentUid}`} className="mt-1 block text-[var(--primary)]">
                          {workspace.talentName || workspace.talentUid || "N/A"}
                        </Link>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Status</div>
                        <div className="mt-1 text-gray-900">{workspace.status || "N/A"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Gig</div>
                        <Link href={`/admin/gigs/${workspace.gigId}`} className="mt-1 block text-[var(--primary)]">
                          {workspace.gigTitle || workspace.gigId || "N/A"}
                        </Link>
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
                    <Link href={`/admin/talents/${workspace.talentUid}`} className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]">
                      View talent
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
