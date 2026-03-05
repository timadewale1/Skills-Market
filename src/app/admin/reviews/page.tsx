import { getAdminDb } from "@/lib/firebaseAdmin"
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
  // TODO: Add proper auth middleware for admin routes
  const reviews: any = await getReviews()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reviews</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Reviewer</th>
            <th className="p-2">Reviewee</th>
            <th className="p-2">Rating</th>
            <th className="p-2">Comment</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((r: any) => (
            <tr key={r.id} className="border-t">
              <td className="p-2">{r.reviewerId}</td>
              <td className="p-2">{r.revieweeId}</td>
              <td className="p-2">{r.rating}/5</td>
              <td className="p-2">{r.comment}</td>
              <td className="p-2">
                <button className="text-red-600 hover:underline">Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}