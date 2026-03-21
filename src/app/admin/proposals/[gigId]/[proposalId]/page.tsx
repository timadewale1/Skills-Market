import Link from "next/link"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { formatAdminDate } from "@/lib/adminData"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ gigId: string; proposalId: string }>
}

async function getProposal(gigId: string, proposalId: string) {
  const db = getAdminDb()
  const [gigSnap, proposalSnap] = await Promise.all([
    db.collection("gigs").doc(gigId).get(),
    db.collection("gigs").doc(gigId).collection("proposals").doc(proposalId).get(),
  ])

  if (!proposalSnap.exists) return null

  return {
    gig: gigSnap.exists ? { id: gigSnap.id, ...gigSnap.data() } : null,
    proposal: { id: proposalSnap.id, ...proposalSnap.data() },
  }
}

export default async function AdminProposalDetailPage({ params }: PageProps) {
  const { gigId, proposalId } = await params
  const detail: any = await getProposal(gigId, proposalId)

  if (!detail) {
    return (
      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="p-10 text-center text-gray-600">Proposal not found.</CardContent>
      </Card>
    )
  }

  const { proposal, gig } = detail

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Proposal detail"
        title={proposal.talentName || proposal.talentUid || "Proposal"}
        description="Read the full proposal exactly as submitted, alongside the linked gig context and current proposal status."
        actions={
          <Link
            href="/admin/proposals"
            className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
          >
            Back to proposals
          </Link>
        }
        stats={[
          { label: "Status", value: proposal.status || "submitted" },
          { label: "Gig", value: gig?.title || gigId },
          { label: "Rate", value: proposal.proposedRate ? `N${Number(proposal.proposedRate).toLocaleString()}` : "N/A" },
          { label: "Submitted", value: formatAdminDate(proposal.createdAt) },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[1.75rem] border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-extrabold">Proposal write-up</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Badge className="bg-orange-50 text-[var(--primary)] hover:bg-orange-50">{proposal.status || "submitted"}</Badge>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
              {proposal.coverLetter || "No cover letter provided."}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-extrabold">Proposal details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="font-semibold text-gray-500">Talent</div>
                <div className="mt-1 text-gray-900">{proposal.talentName || proposal.talentUid || "N/A"}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-500">Duration</div>
                <div className="mt-1 text-gray-900">{proposal.proposedDuration || "N/A"}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-500">Gig</div>
                <Link href={`/admin/gigs/${gigId}`} className="mt-1 block font-semibold text-[var(--primary)]">
                  {gig?.title || gigId}
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-extrabold">Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {proposal.attachments?.length ? (
                proposal.attachments.map((attachment: any, index: number) => (
                  <a
                    key={`${attachment.url || attachment.name || "attachment"}-${index}`}
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl border bg-white px-4 py-3 transition hover:border-orange-200 hover:bg-orange-50"
                  >
                    <div className="font-semibold text-gray-900">{attachment.name || `Attachment ${index + 1}`}</div>
                    <div className="text-xs text-gray-500">{attachment.contentType || "file"}</div>
                  </a>
                ))
              ) : (
                <div className="text-gray-600">No attachments submitted.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
