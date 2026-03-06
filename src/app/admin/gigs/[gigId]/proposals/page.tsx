import Link from "next/link"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
export const dynamic = "force-dynamic"

async function getProposalsForGig(gigId: string) {
  const db = getAdminDb()
  const snap = await db.collection("gigs").doc(gigId).collection("proposals").get()
  return snap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

async function getGigTitle(gigId: string) {
  const db = getAdminDb()
  const snap = await db.collection("gigs").doc(gigId).get()
  return snap.data()?.title || "Gig"
}

function statusBadge(status: string) {
  if (status === "submitted") return <Badge className="bg-orange-100 text-orange-900">Submitted</Badge>
  if (status === "shortlisted") return <Badge className="bg-blue-100 text-blue-900">Shortlisted</Badge>
  if (status === "accepted") return <Badge className="bg-green-100 text-green-900">Accepted</Badge>
  if (status === "rejected") return <Badge className="bg-red-100 text-red-900">Rejected</Badge>
  return <Badge>{status}</Badge>
}

export default async function AdminGigProposalsPage({ params }: { params: { gigId: string } }) {
  const { gigId } = params
  const proposals: any = await getProposalsForGig(gigId)
  const gigTitle = await getGigTitle(gigId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href={`/admin/gigs/${gigId}`} className="text-blue-600 hover:underline mb-6 inline-block">
          ← Back to {gigTitle}
        </Link>

        <h1 className="text-3xl font-extrabold text-gray-900">Proposals for "{gigTitle}"</h1>
        <p className="text-gray-600 mt-2">Manage all proposals submitted for this gig</p>

        <div className="mt-8 space-y-4">
          {proposals.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="p-8 text-center text-gray-600">
                No proposals found
              </CardContent>
            </Card>
          ) : (
            proposals.map((p: any) => (
              <Card key={p.id} className="rounded-xl hover:shadow-md transition">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-3">
                        <h3 className="text-lg font-extrabold text-gray-900">
                          {p.talentName || p.talentUid}
                        </h3>
                        {statusBadge(p.status)}
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{p.coverLetter}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 font-semibold">Talent</span>
                          <Link href={`/admin/talents/${p.talentUid}`} className="text-blue-600 hover:underline block">
                            {p.talentName || p.talentUid}
                          </Link>
                        </div>
                        <div>
                          <span className="text-gray-500 font-semibold">Proposed Rate</span>
                          <p className="text-gray-900 font-semibold">
                            {p.proposedRate ? `₦${Number(p.proposedRate).toLocaleString()}` : "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-semibold">Duration</span>
                          <p className="text-gray-900 font-semibold">{p.proposedDuration || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 font-semibold">Submitted</span>
                          <p className="text-gray-900 font-semibold">
                            {p.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-sm">
                        Review
                      </button>
                      <button className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition text-sm">
                        Delete
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
