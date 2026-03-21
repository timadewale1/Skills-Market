import Link from "next/link"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { buildWorkspaceDisplayTitle, formatAdminDate, formatAdminMoney } from "@/lib/adminData"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ id: string }>
}

async function getWorkspace(id: string) {
  if (!id) return null
  const db = getAdminDb()
  const directWorkspace = await db.collection("workspaces").doc(id).get()
  if (!directWorkspace.exists) return null

  const workspace = { id: directWorkspace.id, ...(directWorkspace.data() as any) }
  const [milestonesSnap, payoutRequestsSnap, finalWorkSnap] = await Promise.all([
    db.collection("workspaces").doc(id).collection("milestones").get(),
    db.collection("workspaces").doc(id).collection("payoutRequests").get(),
    db.collection("workspaces").doc(id).collection("finalWork").doc("submission").get(),
  ])

  return {
    ...workspace,
    milestonesCount: milestonesSnap.size,
    milestones: milestonesSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })),
    payoutRequestsCount: payoutRequestsSnap.size,
    finalWork: finalWorkSnap.exists ? (finalWorkSnap.data() as any) : null,
  }
}

function statusBadge(status?: string) {
  return <Badge className="bg-orange-50 text-[var(--primary)] hover:bg-orange-50">{status || "unknown"}</Badge>
}

export default async function WorkspaceDetailPage({ params }: PageProps) {
  const { id } = await params
  const workspace: any = await getWorkspace(id)

  if (!workspace) {
    return (
      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="p-10 text-center text-gray-600">Workspace not found.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Workspace detail"
        title={buildWorkspaceDisplayTitle(workspace)}
        description="Inspect the delivery record, payment state, milestones, final submission, and linked parties from one admin workspace view."
        actions={
          <Link
            href="/admin/workspaces"
            className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
          >
            Back to workspaces
          </Link>
        }
        stats={[
          { label: "Status", value: workspace.status || "unknown" },
          { label: "Client", value: workspace.clientName || workspace.clientUid || "N/A" },
          { label: "Talent", value: workspace.talentName || workspace.talentUid || "N/A" },
          { label: "Gig", value: workspace.gigTitle || workspace.gigId || "N/A" },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.75rem] border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-gray-900">Workspace summary</h2>
              {statusBadge(workspace.status)}
            </div>

            <div className="mt-5 grid gap-4 text-sm md:grid-cols-2">
              <div>
                <div className="font-semibold text-gray-500">Created</div>
                <div className="mt-1 text-gray-900">{formatAdminDate(workspace.createdAt, true)}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-500">Payment state</div>
                <div className="mt-1 text-gray-900">{workspace.payment?.status || "not funded"}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-500">Escrow amount</div>
                <div className="mt-1 text-gray-900">{formatAdminMoney(workspace.payment?.amount || 0)}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-500">Escrow held</div>
                <div className="mt-1 text-gray-900">{workspace.payment?.escrow === false ? "Released" : "Held"}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-500">Milestones</div>
                <div className="mt-1 text-gray-900">{workspace.milestonesCount || workspace.milestones?.length || 0}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-500">Payout requests</div>
                <div className="mt-1 text-gray-900">{workspace.payoutRequestsCount || 0}</div>
              </div>
            </div>

            {workspace.description ? (
              <div className="mt-6">
                <div className="font-semibold text-gray-500">Notes</div>
                <div className="mt-2 text-sm leading-7 text-gray-700">{workspace.description}</div>
              </div>
            ) : null}

            {workspace.finalWork ? (
              <div className="mt-6 rounded-2xl border bg-[var(--secondary)] p-4">
                <div className="font-semibold text-gray-900">Final work</div>
                <div className="mt-2 grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <div className="font-semibold text-gray-500">Submission status</div>
                    <div className="mt-1 text-gray-900">{workspace.finalWork.status || "submitted"}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-500">Submitted</div>
                    <div className="mt-1 text-gray-900">{formatAdminDate(workspace.finalWork.submittedAt, true)}</div>
                  </div>
                </div>
                {workspace.finalWork.attachments?.length ? (
                  <div className="mt-4 space-y-2">
                    {workspace.finalWork.attachments.map((attachment: any, index: number) => (
                      <a key={`${attachment.storagePath || attachment.name || "final"}-${index}`} href={attachment.rawUrl || attachment.url || "#"} target="_blank" rel="noreferrer" className="block rounded-2xl border bg-white px-4 py-3 text-sm text-gray-900 transition hover:border-orange-200 hover:bg-orange-50">
                        {attachment.name || `Final work attachment ${index + 1}`}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            {workspace.milestones?.length ? (
              <div className="mt-6">
                <div className="font-semibold text-gray-900">Milestone submissions</div>
                <div className="mt-3 space-y-3">
                  {workspace.milestones.map((milestone: any) => (
                    <div key={milestone.id} className="rounded-2xl border bg-white p-4">
                      <div className="font-semibold text-gray-900">{milestone.title || milestone.id}</div>
                      <div className="mt-1 text-sm text-gray-600">{milestone.status || "unknown"}</div>
                      {milestone.attachments?.length ? (
                        <div className="mt-3 space-y-2">
                          {milestone.attachments.map((attachment: any, index: number) => (
                            <a key={`${attachment.storagePath || attachment.name || "milestone"}-${index}`} href={attachment.rawUrl || attachment.url || "#"} target="_blank" rel="noreferrer" className="block rounded-xl border bg-[var(--secondary)] px-3 py-2 text-sm text-gray-900">
                              {attachment.name || `Attachment ${index + 1}`}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-extrabold text-gray-900">Linked records</h2>
              <div className="mt-4 space-y-3">
                <Link href={`/admin/gigs/${workspace.gigId}`} className="block rounded-2xl border bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-orange-200 hover:bg-white">
                  View gig
                </Link>
                <Link href={`/admin/clients/${workspace.clientUid}`} className="block rounded-2xl border bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-orange-200 hover:bg-white">
                  View client
                </Link>
                <Link href={`/admin/talents/${workspace.talentUid}`} className="block rounded-2xl border bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-orange-200 hover:bg-white">
                  View talent
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-extrabold text-gray-900">Admin actions</h2>
              <p className="mt-3 text-sm leading-7 text-gray-600">
                This page now mirrors the admin delivery flow: inspect workspace funding, milestone count, final work, payout progression, and related user records before taking action elsewhere.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
