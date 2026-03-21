import Link from "next/link"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { formatAdminDate } from "@/lib/adminData"

export const dynamic = "force-dynamic"

type ProposalsPageProps = {
  searchParams?: Promise<{ q?: string; status?: string; page?: string }>
}

async function getProposals() {
  const db = getAdminDb()
  const gigsSnap = await db.collection("gigs").get()
  const proposals: any[] = []

  for (const gigDoc of gigsSnap.docs) {
    const proposalsSnap = await db.collection("gigs").doc(gigDoc.id).collection("proposals").get()
    proposalsSnap.docs.forEach((doc: any) => {
      proposals.push({
        id: doc.id,
        gigId: gigDoc.id,
        gigTitle: gigDoc.data().title,
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

function proposalStatus(status?: string) {
  return <Badge className="bg-orange-50 text-[var(--primary)] hover:bg-orange-50">{status || "submitted"}</Badge>
}

export default async function ProposalsPage({ searchParams }: ProposalsPageProps) {
  const proposals: any[] = await getProposals()
  const resolvedSearchParams = (await searchParams) || {}
  const q = String(resolvedSearchParams.q || "").trim().toLowerCase()
  const status = String(resolvedSearchParams.status || "all")
  const page = Math.max(1, Number(resolvedSearchParams.page || 1))
  const pageSize = 10
  const filtered = proposals.filter((proposal) => {
    if (status !== "all" && String(proposal.status || "submitted") !== status) return false
    if (!q) return true
    const blob = `${proposal.gigTitle || ""} ${proposal.talentName || ""} ${proposal.coverLetter || ""}`.toLowerCase()
    return blob.includes(q)
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const paramsFor = (next: Record<string, string>) => {
    const params = new URLSearchParams()
    const finalQ = next.q ?? String(resolvedSearchParams.q || "")
    const finalStatus = next.status ?? status
    const finalPage = next.page ?? String(safePage)
    if (finalQ) params.set("q", finalQ)
    if (finalStatus && finalStatus !== "all") params.set("status", finalStatus)
    if (finalPage && finalPage !== "1") params.set("page", finalPage)
    const s = params.toString()
    return s ? `/admin/proposals?${s}` : "/admin/proposals"
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Proposal oversight"
        title="Review proposals"
        description="Scan all submitted proposals across gigs so the admin team can inspect proposal quality, volume, and acceptance flow."
        stats={[
          { label: "Proposals", value: filtered.length },
          { label: "View", value: "Cross-gig" },
          { label: "Mode", value: "Admin review" },
          { label: "Latest", value: "Realtime" },
        ]}
      />

      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-6">
          <form action="/admin/proposals" className="flex flex-col gap-3 lg:flex-row">
            <input
              name="q"
              defaultValue={resolvedSearchParams.q || ""}
              placeholder="Search by gig, talent, or cover letter"
              className="w-full rounded-full border px-4 py-2 text-sm"
            />
            <select name="status" defaultValue={status} className="rounded-full border px-4 py-2 text-sm">
              <option value="all">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
            <button className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white">Apply</button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {visible.length === 0 ? (
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-10 text-center text-gray-600">No proposals found.</CardContent>
          </Card>
        ) : (
          visible.map((proposal) => (
            <Card key={`${proposal.gigId}-${proposal.id}`} className="rounded-[1.75rem] border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-extrabold text-gray-900">{proposal.talentName || proposal.talentUid || "Unknown talent"}</h2>
                      {proposalStatus(proposal.status)}
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">
                      {proposal.coverLetter || "No cover letter provided."}
                    </p>

                    <div className="mt-4 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <div className="font-semibold text-gray-500">Gig</div>
                        <div className="mt-1 text-gray-900">{proposal.gigTitle || proposal.gigId}</div>
                      </div>
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
                        <div className="font-semibold text-gray-500">Submitted</div>
                        <div className="mt-1 text-gray-900">{formatAdminDate(proposal.createdAt)}</div>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/admin/proposals/${proposal.gigId}/${proposal.id}`}
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
      {filtered.length > pageSize ? (
        <div className="flex items-center justify-center gap-3">
          <Link
            href={paramsFor({ page: String(Math.max(1, safePage - 1)) })}
            className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Previous
          </Link>
          <div className="text-sm font-semibold text-gray-600">
            Page {safePage} of {totalPages}
          </div>
          <Link
            href={paramsFor({ page: String(Math.min(totalPages, safePage + 1)) })}
            className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Next
          </Link>
        </div>
      ) : null}
    </div>
  )
}
