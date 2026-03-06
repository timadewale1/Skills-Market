import Link from "next/link"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
export const dynamic = "force-dynamic"

async function getGig(gigId: string) {
  const db = getAdminDb()
  const doc = await db.collection("gigs").doc(gigId).get()
  if (!doc.exists) return null
  return {
    id: doc.id,
    ...doc.data(),
  }
}

function money(n?: number | null) {
  if (n === null || n === undefined) return "—"
  return `₦${Number(n).toLocaleString()}`
}

function statusBadge(status: string) {
  if (status === "open") return <Badge className="bg-green-100 text-green-800">Open</Badge>
  if (status === "closed") return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>
  return <Badge>{status}</Badge>
}

export default async function AdminGigDetailPage({ params }: { params: { gigId: string } }) {
  const { gigId } = params
  const gig: any = await getGig(gigId)

  if (!gig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900">Gig not found</h1>
        </div>
      </div>
    )
  }

  const budgetLabel = gig.budgetType === "fixed" ? `₦${money(gig.fixedBudget)} (Fixed)` : `₦${money(gig.hourlyRate)}/hr`

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/admin/gigs" className="text-blue-600 hover:underline mb-6 inline-block">
          ← Back to Gigs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-xl">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl">{gig.title}</CardTitle>
                    <div className="mt-2">{statusBadge(gig.status || "open")}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {gig.description && (
                  <div>
                    <h3 className="font-semibold text-gray-900">Description</h3>
                    <p className="text-gray-600 mt-1 whitespace-pre-wrap">{gig.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <span className="text-gray-500 text-sm font-semibold">Budget Type</span>
                    <p className="text-gray-900 font-semibold">{budgetLabel}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm font-semibold">Duration</span>
                    <p className="text-gray-900 font-semibold">{gig.duration || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm font-semibold">Hires Needed</span>
                    <p className="text-gray-900 font-semibold">{gig.hiresNeeded || 1}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm font-semibold">Level</span>
                    <p className="text-gray-900 font-semibold">{gig.level || "N/A"}</p>
                  </div>
                </div>

                {gig.categories && gig.categories.length > 0 && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {gig.categories.map((cat: string) => (
                        <Badge key={cat} variant="outline">{cat}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Data Tabs */}
            <div className="flex gap-4 border-b">
              <Link
                href={`/admin/gigs/${gigId}/proposals`}
                className="px-4 py-2 font-semibold text-blue-600 border-b-2 border-blue-600"
              >
                Proposals
              </Link>
              <Link
                href={`/admin/gigs/${gigId}/workspaces`}
                className="px-4 py-2 font-semibold text-gray-600 hover:text-gray-900"
              >
                Workspaces
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-gray-500 text-sm font-semibold">Client Name</span>
                  <Link
                    href={`/admin/clients/${gig.clientUid}`}
                    className="text-blue-600 hover:underline font-semibold block"
                  >
                    {gig.clientName || gig.clientUid}
                  </Link>
                </div>
                <div>
                  <span className="text-gray-500 text-sm font-semibold">Client UID</span>
                  <p className="text-gray-900 text-sm">{gig.clientUid}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm font-semibold">Created</span>
                  <p className="text-gray-900 font-semibold">
                    {gig.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition">
                  Edit Gig
                </button>
                <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition">
                  Delete Gig
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
