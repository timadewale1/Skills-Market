import Link from "next/link"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAdminDb } from "@/lib/firebaseAdmin"

export const dynamic = "force-dynamic"

async function getDispute(id: string) {
  const db = getAdminDb()
  const doc = await db.collection("disputes").doc(id).get()
  if (!doc.exists) return null

  const data = doc.data() as any
  const clientUid = data.clientUid || data.clientId || null
  const talentUid = data.talentUid || data.talentId || null
  const [workspaceSnap, clientSnap, talentSnap] = await Promise.all([
    data.workspaceId ? db.collection("workspaces").doc(data.workspaceId).get() : null,
    clientUid ? db.collection("users").doc(clientUid).get() : null,
    talentUid ? db.collection("users").doc(talentUid).get() : null,
  ])

  return {
    id: doc.id,
    ...data,
    workspace: workspaceSnap?.exists ? { id: workspaceSnap.id, ...(workspaceSnap.data() as any) } : null,
    client: clientSnap?.exists ? { id: clientSnap.id, ...(clientSnap.data() as any) } : null,
    talent: talentSnap?.exists ? { id: talentSnap.id, ...(talentSnap.data() as any) } : null,
  }
}

function formatDate(value: any) {
  return value?.toDate?.().toLocaleString() || "N/A"
}

function statusTone(status?: string) {
  if (!status) return "bg-gray-100 text-gray-700 hover:bg-gray-100"
  if (status.includes("resolved") || status === "closed") return "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
  if (status.includes("review")) return "bg-amber-50 text-amber-700 hover:bg-amber-50"
  return "bg-orange-50 text-[var(--primary)] hover:bg-orange-50"
}

export default async function DisputeResolvePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const dispute: any = await getDispute(id)

  if (!dispute) {
    return (
      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="p-10 text-center text-gray-600">Dispute not found.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Dispute detail"
        title={`Dispute ${id.slice(-8)}`}
        description="Inspect the dispute record, the parties involved, and the linked workspace before resolving the case from the main dispute queue."
        actions={
          <Link
            href="/admin/disputes"
            className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
          >
            Back to disputes
          </Link>
        }
        stats={[
          { label: "Status", value: dispute.status || "open" },
          { label: "Stage", value: dispute.stage || "N/A" },
          { label: "Raised by", value: dispute.raisedBy || "N/A" },
          { label: "Evidence", value: dispute.evidenceCount || 0 },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.75rem] border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-gray-900">Case summary</h2>
              <Badge className={statusTone(dispute.status)}>{dispute.status || "open"}</Badge>
            </div>

            <div className="mt-6 grid gap-4 text-sm md:grid-cols-2">
              <div>
                <div className="font-semibold text-gray-500">Reason</div>
                <div className="mt-1 text-gray-900">{dispute.reason || "N/A"}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-500">Created</div>
                <div className="mt-1 text-gray-900">{formatDate(dispute.createdAt)}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-500">Client</div>
                <div className="mt-1 text-gray-900">
                  {dispute.client?.fullName || dispute.client?.email || dispute.clientUid || dispute.clientId || "N/A"}
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-500">Talent</div>
                <div className="mt-1 text-gray-900">
                  {dispute.talent?.fullName || dispute.talent?.email || dispute.talentUid || dispute.talentId || "N/A"}
                </div>
              </div>
            </div>

            {dispute.description ? (
              <div className="mt-6">
                <div className="font-semibold text-gray-500">Reported details</div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                  {dispute.description}
                </p>
              </div>
            ) : null}

            {(dispute.resolution || dispute.adminNotes) ? (
              <div className="mt-6 rounded-2xl border bg-[var(--secondary)] p-4">
                <div className="font-semibold text-gray-900">Resolution notes</div>
                <div className="mt-2 space-y-2 text-sm leading-7 text-gray-700">
                  {dispute.resolution ? <p>{dispute.resolution}</p> : null}
                  {dispute.adminNotes ? <p>{dispute.adminNotes}</p> : null}
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
                {dispute.workspaceId ? (
                  <Link href={`/admin/workspaces/${dispute.workspaceId}`} className="block rounded-2xl border bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-orange-200 hover:bg-white">
                    View workspace
                  </Link>
                ) : null}
                {(dispute.clientUid || dispute.clientId) ? (
                  <Link href={`/admin/clients/${dispute.clientUid || dispute.clientId}`} className="block rounded-2xl border bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-orange-200 hover:bg-white">
                    View client
                  </Link>
                ) : null}
                {(dispute.talentUid || dispute.talentId) ? (
                  <Link href={`/admin/talents/${dispute.talentUid || dispute.talentId}`} className="block rounded-2xl border bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-orange-200 hover:bg-white">
                    View talent
                  </Link>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-extrabold text-gray-900">Admin actions</h2>
              <p className="mt-3 text-sm leading-7 text-gray-600">
                Use the main disputes queue to complete payout release, refund, partial settlement, or close-case actions. This page is the read-only case review view for linked records and evidence context.
              </p>
              <Link
                href="/admin/disputes"
                className="mt-4 inline-flex rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
              >
                Open dispute queue
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
