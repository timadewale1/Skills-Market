import Link from "next/link"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAdminDb } from "@/lib/firebaseAdmin"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ gigId: string }>
}

async function getGig(gigId: string) {
  if (!gigId) return null
  const db = getAdminDb()
  const doc = await db.collection("gigs").doc(gigId).get()
  if (!doc.exists) return null
  return { id: doc.id, ...(doc.data() as any) }
}

function budgetLabel(gig: any) {
  if (gig.budgetType === "fixed") return `N${Number(gig.fixedBudget || 0).toLocaleString()} fixed`
  if (gig.budgetType === "hourly") return `N${Number(gig.hourlyRate || 0).toLocaleString()}/hr`
  return "N/A"
}

export default async function AdminGigDetailPage({ params }: PageProps) {
  const { gigId } = await params
  const gig: any = await getGig(gigId)

  if (!gig) {
    return (
      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="p-10 text-center text-gray-600">Gig not found.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Gig detail"
        title={gig.title}
        description="Inspect the full admin view of this opportunity, then jump into related proposal and workspace records."
        actions={
          <Link
            href="/admin/gigs"
            className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
          >
            Back to gigs
          </Link>
        }
        stats={[
          { label: "Status", value: gig.status || "unknown" },
          { label: "Budget", value: budgetLabel(gig) },
          { label: "Hires", value: gig.hiresNeeded || 1 },
          { label: "Level", value: gig.level || "N/A" },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.75rem] border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-gray-900">Gig summary</h2>
              <Badge className="bg-orange-50 text-[var(--primary)] hover:bg-orange-50">
                {gig.status || "unknown"}
              </Badge>
            </div>

            {gig.description ? (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-700">{gig.description}</p>
            ) : null}

            <div className="mt-6 grid gap-4 text-sm md:grid-cols-2">
              <div>
                <div className="font-semibold text-gray-500">Client</div>
                <Link href={`/admin/clients/${gig.clientUid}`} className="mt-1 block font-semibold text-[var(--primary)]">
                  {gig.clientName || gig.clientUid}
                </Link>
              </div>
              <div>
                <div className="font-semibold text-gray-500">Created</div>
                <div className="mt-1 text-gray-900">{gig.createdAt?.toDate?.().toLocaleDateString("en-NG") || "N/A"}</div>
              </div>
            </div>

            {gig.categories?.length ? (
              <div className="mt-6">
                <div className="font-semibold text-gray-500">Categories</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {gig.categories.map((category: string) => (
                    <Badge key={category} variant="outline">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-extrabold text-gray-900">Related records</h2>
              <div className="mt-4 space-y-3">
                <Link href={`/admin/gigs/${gigId}/proposals`} className="block rounded-2xl border bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-orange-200 hover:bg-white">
                  View proposals
                </Link>
                <Link href={`/admin/gigs/${gigId}/workspaces`} className="block rounded-2xl border bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-orange-200 hover:bg-white">
                  View workspaces
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-extrabold text-gray-900">Admin actions</h2>
              <p className="mt-3 text-sm leading-7 text-gray-600">
                This page is currently the admin inspection surface for gig quality, linked proposals, and workspace creation context.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
