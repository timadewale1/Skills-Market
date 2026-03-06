import { getAdminDb } from "@/lib/firebaseAdmin"
import { Card, CardContent } from "@/components/ui/card"
export const dynamic = "force-dynamic"

async function getReviews() {
  const db = getAdminDb()
  const snap = await db.collection("reviews").get()
  return snap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

export default async function ReviewsPage() {
  const reviews: any = await getReviews()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Reviews</h1>
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="p-8 text-center text-gray-600">
                No reviews found
              </CardContent>
            </Card>
          ) : (
            reviews.map((r: any) => (
              <Card key={r.id} className="rounded-xl hover:shadow-md transition">
                <CardContent className="p-6 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-extrabold text-gray-900 mb-2">
                      {r.rating}/5 ⭐
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 font-semibold">From</span>
                        <p className="text-gray-900">{r.reviewerId}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold">To</span>
                        <p className="text-gray-900">{r.revieweeId}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500 font-semibold">Comment</span>
                        <p className="text-gray-900 line-clamp-2">{r.comment}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition text-sm">
                      Remove
                    </button>
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