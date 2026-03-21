import Link from "next/link"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { formatAdminDate, getAdminIndexes, getUserSummary } from "@/lib/adminData"
import DeleteReviewButton from "@/components/admin/DeleteReviewButton"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ reviewId: string }>
  searchParams?: Promise<{ kind?: string }>
}

async function getReview(reviewId: string, kind: string) {
  const db = getAdminDb()
  const indexes = await getAdminIndexes()
  const collectionName = kind === "platform" ? "platform_reviews" : "reviews"
  const reviewSnap = await db.collection(collectionName).doc(reviewId).get()
  if (!reviewSnap.exists) return null
  const review = reviewSnap.data() as any
  const workspaceSnap = review.workspaceId ? await db.collection("workspaces").doc(review.workspaceId).get() : null
  const workspace = workspaceSnap?.exists ? workspaceSnap.data() : {}
  return {
    id: reviewSnap.id,
    ...review,
    from: getUserSummary(review.fromUserId, indexes),
    to: kind === "platform" ? null : getUserSummary(review.toUserId, indexes),
    workspaceLabel: workspace?.gigTitle ? `Workspace from ${workspace.gigTitle}` : review.workspaceId || "N/A",
    kind,
  }
}

export default async function AdminReviewDetailPage({ params, searchParams }: PageProps) {
  const { reviewId } = await params
  const resolvedSearchParams = (await searchParams) || {}
  const kind = String(resolvedSearchParams.kind || "client") === "platform" ? "platform" : "peer"
  const review: any = await getReview(reviewId, kind)

  if (!review) {
    return (
      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="p-10 text-center text-gray-600">Review not found.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Review detail"
        title={review.title || "Workspace review"}
        description="This mirrors the workspace review view with the real reviewer, recipient, workspace, rating, and written feedback."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/reviews"
              className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
            >
              Back to reviews
            </Link>
            <DeleteReviewButton reviewId={review.id} kind={kind === "platform" ? "platform" : "peer"} />
          </div>
        }
        stats={[
          { label: "Rating", value: `${review.rating || 0}/5` },
          { label: "From", value: review.from?.name || review.userName || "N/A" },
          { label: "To", value: review.to?.name || "Platform" },
          { label: "Workspace", value: review.workspaceLabel },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[1.75rem] border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-extrabold">Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="font-semibold text-gray-500">Comment</div>
              <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-700">{review.publicComment || review.comment || "No comment left."}</div>
            </div>
            {review.privateFeedback ? (
              <div>
                <div className="font-semibold text-gray-500">Private feedback</div>
                <div className="mt-2 whitespace-pre-wrap rounded-2xl bg-[var(--secondary)] p-4 text-sm leading-7 text-gray-700">{review.privateFeedback}</div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-extrabold">Review details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="font-semibold text-gray-500">Submitted</div>
              <div className="mt-1 text-gray-900">{formatAdminDate(review.createdAt, true)}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-500">Communication</div>
              <div className="mt-1 text-gray-900">{review.communicationRating || "N/A"}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-500">Professionalism</div>
              <div className="mt-1 text-gray-900">{review.professionalismRating || "N/A"}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-500">Timeliness</div>
              <div className="mt-1 text-gray-900">{review.timelinessRating || "N/A"}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
