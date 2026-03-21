import Link from "next/link"
import { getAdminDb } from "@/lib/firebaseAdmin"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
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

function budgetLabel(gig: any) {
  if (gig.budgetType === "fixed") return `N${Number(gig.fixedBudget || 0).toLocaleString()} fixed`
  if (gig.budgetType === "hourly") return `N${Number(gig.hourlyRate || 0).toLocaleString()}/hr`
  return "N/A"
}

function statusBadge(status?: string) {
  if (status === "open") return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Open</Badge>
  if (status === "closed") return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Closed</Badge>
  return <Badge className="bg-orange-50 text-[var(--primary)] hover:bg-orange-50">{status || "Unknown"}</Badge>
}

export default async function ClientGigsPage({
  params,
}: {
  params: Promise<{ uid: string }>
}) {
  const { uid } = await params
  const gigs: any[] = await getClientGigs(uid)
  const clientName = await getClientName(uid)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Client operations"
        title={`Gigs by ${clientName}`}
        description="Review every opportunity posted by this client, including budget shape, hiring intent, and where to jump next for proposals or workspace outcomes."
        actions={
          <Link
            href={`/admin/clients/${uid}`}
            className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
          >
            Back to client
          </Link>
        }
        stats={[
          { label: "Total gigs", value: gigs.length },
          { label: "Open", value: gigs.filter((gig) => gig.status === "open").length },
          { label: "Closed", value: gigs.filter((gig) => gig.status === "closed").length },
          { label: "Draft/other", value: gigs.filter((gig) => !["open", "closed"].includes(gig.status || "")).length },
        ]}
      />

      <div className="space-y-4">
        {gigs.length === 0 ? (
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-10 text-center text-gray-600">No gigs found for this client.</CardContent>
          </Card>
        ) : (
          gigs.map((gig) => (
            <Card key={gig.id} className="rounded-[1.75rem] border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-extrabold text-gray-900">{gig.title || "Untitled gig"}</h2>
                      {statusBadge(gig.status)}
                    </div>

                    {gig.description ? (
                      <p className="mt-3 line-clamp-2 text-sm leading-7 text-gray-600">{gig.description}</p>
                    ) : null}

                    <div className="mt-4 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <div className="font-semibold text-gray-500">Budget</div>
                        <div className="mt-1 text-gray-900">{budgetLabel(gig)}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Hires needed</div>
                        <div className="mt-1 text-gray-900">{gig.hiresNeeded || 1}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Duration</div>
                        <div className="mt-1 text-gray-900">{gig.duration || "N/A"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Created</div>
                        <div className="mt-1 text-gray-900">{gig.createdAt?.toDate?.().toLocaleDateString() || "N/A"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/gigs/${gig.id}`} className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]">
                      View gig
                    </Link>
                    <Link href={`/admin/gigs/${gig.id}/proposals`} className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]">
                      View proposals
                    </Link>
                    <Link href={`/admin/gigs/${gig.id}/workspaces`} className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]">
                      View workspaces
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
