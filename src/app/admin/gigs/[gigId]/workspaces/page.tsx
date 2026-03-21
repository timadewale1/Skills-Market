import Link from "next/link"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAdminDb } from "@/lib/firebaseAdmin"

export const dynamic = "force-dynamic"

async function getWorkspacesForGig(gigId: string) {
  const db = getAdminDb()
  const snap = await db.collection("workspaces").where("gigId", "==", gigId).get()
  return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
}

async function getGigTitle(gigId: string) {
  const db = getAdminDb()
  const snap = await db.collection("gigs").doc(gigId).get()
  return snap.data()?.title || "Gig"
}

export default async function AdminGigWorkspacesPage({
  params,
}: {
  params: Promise<{ gigId: string }>
}) {
  const { gigId } = await params
  const workspaces: any[] = await getWorkspacesForGig(gigId)
  const gigTitle = await getGigTitle(gigId)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Gig workspaces"
        title={`Workspaces for ${gigTitle}`}
        description="Track every workspace created from this gig so admin can follow hiring, delivery, and payout progress from one place."
        actions={
          <Link
            href={`/admin/gigs/${gigId}`}
            className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
          >
            Back to gig
          </Link>
        }
        stats={[
          { label: "Workspaces", value: workspaces.length },
          { label: "Gig", value: gigTitle },
          { label: "Scope", value: "Single gig" },
          { label: "Latest", value: "Realtime" },
        ]}
      />

      <div className="space-y-4">
        {workspaces.length === 0 ? (
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-10 text-center text-gray-600">No workspaces found.</CardContent>
          </Card>
        ) : (
          workspaces.map((workspace) => (
            <Card key={workspace.id} className="rounded-[1.75rem] border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-extrabold text-gray-900">
                        {workspace.gigTitle || workspace.id}
                      </h2>
                      <Badge className="bg-orange-50 text-[var(--primary)] hover:bg-orange-50">
                        {workspace.status || "unknown"}
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <div className="font-semibold text-gray-500">Talent</div>
                        <div className="mt-1 text-gray-900">{workspace.talentName || workspace.talentUid || "N/A"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Client</div>
                        <div className="mt-1 text-gray-900">{workspace.clientName || workspace.clientUid || "N/A"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Status</div>
                        <div className="mt-1 text-gray-900">{workspace.status || "N/A"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Created</div>
                        <div className="mt-1 text-gray-900">
                          {workspace.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/admin/workspaces/${workspace.id}`}
                    className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    View workspace
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
