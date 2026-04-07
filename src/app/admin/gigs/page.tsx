import Link from "next/link"
import { getAdminDb } from "@/lib/firebaseAdmin"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import AdminDeleteGigButton from "@/components/admin/AdminDeleteGigButton"

export const dynamic = "force-dynamic"

async function getGigs() {
  const db = getAdminDb()
  const snap = await db.collection("gigs").orderBy("createdAt", "desc").get()
  return snap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

function money(value?: number | null) {
  if (value === null || value === undefined) return "N/A"
  return `N${Number(value).toLocaleString()}`
}

function budgetLabel(gig: any) {
  if (gig.budgetType === "hourly") return `${money(gig.hourlyRate)}/hr`
  if (gig.budgetType === "fixed") return `${money(gig.fixedBudget)} fixed`
  return "N/A"
}

export default async function AdminGigsPage() {
  const gigs: any[] = await getGigs()
  const openCount = gigs.filter((gig) => gig.status === "open").length
  const closedCount = gigs.filter((gig) => gig.status === "closed").length

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Gig operations"
        title="Monitor gigs"
        description="Track the opportunities being posted on the marketplace, review quality, and jump into the client, proposal, or workspace flow when needed."
        stats={[
          { label: "Total gigs", value: gigs.length },
          { label: "Open", value: openCount },
          { label: "Closed", value: closedCount },
          { label: "Latest view", value: "Realtime" },
        ]}
      />

      <div className="space-y-4">
        {gigs.length === 0 ? (
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-10 text-center text-gray-600">
              No gigs found.
            </CardContent>
          </Card>
        ) : (
          gigs.map((gig) => (
            <Card key={gig.id} className="rounded-[1.75rem] border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-extrabold text-gray-900">{gig.title}</h2>
                      <Badge className="bg-orange-50 text-[var(--primary)] hover:bg-orange-50">
                        {gig.status || "unknown"}
                      </Badge>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">
                      {gig.description || "No description provided."}
                    </p>

                    <div className="mt-4 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <div className="font-semibold text-gray-500">Client</div>
                        <div className="mt-1">
                          <Link href={`/admin/clients/${gig.clientUid}`} className="font-semibold text-[var(--primary)]">
                            {gig.clientName || gig.clientUid}
                          </Link>
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Budget</div>
                        <div className="mt-1 text-gray-900">{budgetLabel(gig)}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Hires needed</div>
                        <div className="mt-1 text-gray-900">{gig.hiresNeeded || 1}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Created</div>
                        <div className="mt-1 text-gray-900">
                          {gig.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/gigs/${gig.id}`}
                      className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      View gig
                    </Link>
                    <AdminDeleteGigButton gigId={gig.id} />
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
