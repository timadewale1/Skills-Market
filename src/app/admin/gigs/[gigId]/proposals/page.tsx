import Link from "next/link"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAdminDb } from "@/lib/firebaseAdmin"

export const dynamic = "force-dynamic"

async function getProposalsForGig(gigId: string) {
  const db = getAdminDb()
  const snap = await db.collection("gigs").doc(gigId).collection("proposals").get()
  return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
}

async function getGigTitle(gigId: string) {
  const db = getAdminDb()
  const snap = await db.collection("gigs").doc(gigId).get()
  return snap.data()?.title || "Gig"
}

export default async function AdminGigProposalsPage({
  params,
}: {
  params: Promise<{ gigId: string }>
}) {
  const { gigId } = await params
  const proposals: any[] = await getProposalsForGig(gigId)
  const gigTitle = await getGigTitle(gigId)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Gig proposals"
        title={`Proposals for ${gigTitle}`}
        description="Review every proposal submitted for this gig, including who applied, their rate, and the current proposal state."
        actions={
          <Link
            href={`/admin/gigs/${gigId}`}
            className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
          >
            Back to gig
          </Link>
        }
        stats={[
          { label: "Proposals", value: proposals.length },
          { label: "Gig", value: gigTitle },
          { label: "Scope", value: "Single gig" },
          { label: "Latest", value: "Realtime" },
        ]}
      />

      <div className="space-y-4">
        {proposals.length === 0 ? (
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-10 text-center text-gray-600">No proposals found.</CardContent>
          </Card>
        ) : (
          proposals.map((proposal) => (
            <Card key={proposal.id} className="rounded-[1.75rem] border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-extrabold text-gray-900">
                        {proposal.talentName || proposal.talentUid || "Unknown talent"}
                      </h2>
                      <Badge className="bg-orange-50 text-[var(--primary)] hover:bg-orange-50">
                        {proposal.status || "submitted"}
                      </Badge>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">
                      {proposal.coverLetter || "No cover letter provided."}
                    </p>

                    <div className="mt-4 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <div className="font-semibold text-gray-500">Talent</div>
                        <div className="mt-1 text-gray-900">{proposal.talentName || proposal.talentUid || "N/A"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Rate</div>
                        <div className="mt-1 text-gray-900">
                          {proposal.proposedRate ? `N${Number(proposal.proposedRate).toLocaleString()}` : "N/A"}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Duration</div>
                        <div className="mt-1 text-gray-900">{proposal.proposedDuration || "N/A"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Submitted</div>
                        <div className="mt-1 text-gray-900">
                          {proposal.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/admin/proposals/${gigId}/${proposal.id}`}
                    className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    View proposal
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
