import Link from "next/link"
import { getAdminDb } from "@/lib/firebaseAdmin"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

async function getClientProposals(clientUid: string) {
  const db = getAdminDb()
  const gigsSnap = await db.collection("gigs").where("clientUid", "==", clientUid).get()
  const gigIds = gigsSnap.docs.map((doc: any) => doc.id)

  const proposals: any[] = []
  for (const gigId of gigIds) {
    const proposalsSnap = await db.collection("gigs").doc(gigId).collection("proposals").get()
    proposalsSnap.docs.forEach((doc: any) => {
      proposals.push({
        id: doc.id,
        gigId,
        ...doc.data(),
      })
    })
  }

  return proposals.sort((a: any, b: any) => {
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
  if (status === "submitted") return <Badge className="bg-orange-50 text-[var(--primary)] hover:bg-orange-50">Submitted</Badge>
  if (status === "shortlisted") return <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">Shortlisted</Badge>
  if (status === "accepted") return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Accepted</Badge>
  if (status === "rejected") return <Badge className="bg-red-50 text-red-700 hover:bg-red-50">Rejected</Badge>
  return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">{status || "Unknown"}</Badge>
}

export default async function ClientProposalsPage({
  params,
}: {
  params: Promise<{ uid: string }>
}) {
  const { uid } = await params
  const proposals: any[] = await getClientProposals(uid)
  const clientName = await getClientName(uid)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Client operations"
        title={`Proposals for ${clientName}`}
        description="Review the incoming pipeline across this client’s gigs so admin can spot acceptance decisions, stalled submissions, and proposal quality issues."
        actions={
          <Link
            href={`/admin/clients/${uid}`}
            className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
          >
            Back to client
          </Link>
        }
        stats={[
          { label: "Total proposals", value: proposals.length },
          { label: "Submitted", value: proposals.filter((proposal) => proposal.status === "submitted").length },
          { label: "Shortlisted", value: proposals.filter((proposal) => proposal.status === "shortlisted").length },
          { label: "Accepted", value: proposals.filter((proposal) => proposal.status === "accepted").length },
        ]}
      />

      <div className="space-y-4">
        {proposals.length === 0 ? (
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-10 text-center text-gray-600">No proposals found for this client.</CardContent>
          </Card>
        ) : (
          proposals.map((proposal) => (
            <Card key={`${proposal.gigId}-${proposal.id}`} className="rounded-[1.75rem] border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-extrabold text-gray-900">{proposal.talentName || proposal.talentUid || "Unknown talent"}</h2>
                      {statusBadge(proposal.status)}
                    </div>

                    {proposal.coverLetter ? (
                      <p className="mt-3 line-clamp-3 text-sm leading-7 text-gray-600">{proposal.coverLetter}</p>
                    ) : null}

                    <div className="mt-4 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <div className="font-semibold text-gray-500">Talent</div>
                        <Link href={`/admin/talents/${proposal.talentUid}`} className="mt-1 block text-[var(--primary)]">
                          {proposal.talentName || proposal.talentUid || "N/A"}
                        </Link>
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
                        <div className="mt-1 text-gray-900">{proposal.createdAt?.toDate?.().toLocaleDateString() || "N/A"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/proposals/${proposal.gigId}/${proposal.id}`} className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
                      View proposal
                    </Link>
                    <Link href={`/admin/talents/${proposal.talentUid}`} className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]">
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
