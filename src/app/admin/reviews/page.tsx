import Link from "next/link"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { formatAdminDate, getAdminIndexes, getUserSummary } from "@/lib/adminData"

export const dynamic = "force-dynamic"

type ReviewsPageProps = {
  searchParams?: Promise<{ kind?: string; page?: string; q?: string }>
}

async function getReviews(kind: string) {
  const db = getAdminDb()
  const indexes = await getAdminIndexes()

  if (kind === "platform") {
    const snap = await db.collection("platform_reviews").orderBy("createdAt", "desc").get()
    const workspaces = await db.collection("workspaces").get()
    const workspaceMap = new Map<string, any>()
    workspaces.docs.forEach((doc: any) => workspaceMap.set(doc.id, doc.data()))
    return snap.docs.map((doc: any) => {
      const data = doc.data() as any
      const workspace = workspaceMap.get(data.workspaceId) || {}
      return {
        id: doc.id,
        kind: "platform",
        ...data,
        from: getUserSummary(data.fromUserId, indexes),
        workspaceLabel: workspace.gigTitle ? `Workspace from ${workspace.gigTitle}` : data.workspaceId || "N/A",
      }
    })
  }

  const snap = await db.collection("reviews").orderBy("createdAt", "desc").get()
  const workspaces = await db.collection("workspaces").get()
  const workspaceMap = new Map<string, any>()
  workspaces.docs.forEach((doc: any) => workspaceMap.set(doc.id, doc.data()))
  const filtered = snap.docs
    .map((doc: any) => ({ id: doc.id, ...doc.data() }))
    .filter((review: any) => (kind === "client" ? review.fromRole === "client" : kind === "talent" ? review.fromRole === "talent" : true))

  return filtered.map((review: any) => {
    const workspace = workspaceMap.get(review.workspaceId) || {}
    return {
      ...review,
      kind: "peer",
      from: getUserSummary(review.fromUserId, indexes),
      to: getUserSummary(review.toUserId, indexes),
      workspaceLabel: workspace.gigTitle ? `Workspace from ${workspace.gigTitle}` : review.workspaceId || "N/A",
    }
  })
}

function kindHref(kind: string) {
  return kind === "all" ? "/admin/reviews" : `/admin/reviews?kind=${kind}`
}

export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const resolvedSearchParams = (await searchParams) || {}
  const kind = String(resolvedSearchParams.kind || "client")
  const q = String(resolvedSearchParams.q || "").trim().toLowerCase()
  const page = Math.max(1, Number(resolvedSearchParams.page || 1))
  const pageSize = 10
  const reviews: any[] = await getReviews(kind)
  const filteredReviews = reviews.filter((review) => {
    if (!q) return true
    const blob = `${review.from?.name || ""} ${review.to?.name || ""} ${review.workspaceLabel || ""} ${review.publicComment || review.comment || ""}`.toLowerCase()
    return blob.includes(q)
  })
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const visibleReviews = filteredReviews.slice((safePage - 1) * pageSize, safePage * pageSize)
  const avgRating =
    filteredReviews.length > 0
      ? (filteredReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / filteredReviews.length).toFixed(1)
      : "0.0"
  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams()
    if (kind) params.set("kind", kind)
    if (q) params.set("q", q)
    if (nextPage > 1) params.set("page", String(nextPage))
    return `/admin/reviews?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Reputation layer"
        title="Reviews"
        description="Review client-to-talent reviews, talent-to-client reviews, and platform reviews separately."
        stats={[
          { label: "Reviews", value: filteredReviews.length },
          { label: "Average rating", value: avgRating },
          { label: "Selected view", value: kind },
          { label: "Latest", value: "Realtime" },
        ]}
      />

      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="flex flex-wrap gap-2 p-6">
          {[
            { key: "client", label: "Client reviews" },
            { key: "talent", label: "Talent reviews" },
            { key: "platform", label: "Platform reviews" },
          ].map((item) => (
            <Link
              key={item.key}
              href={kindHref(item.key)}
              className={[
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                kind === item.key
                  ? "border-orange-500 bg-orange-50 text-[var(--primary)]"
                  : "text-gray-700 hover:border-orange-200 hover:bg-orange-50",
              ].join(" ")}
            >
              {item.label}
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="p-6">
          <form action="/admin/reviews" className="flex flex-col gap-3 lg:flex-row">
            <input type="hidden" name="kind" value={kind} />
            <input
              name="q"
              defaultValue={resolvedSearchParams.q || ""}
              placeholder="Search by reviewer, recipient, workspace, or comment"
              className="w-full rounded-full border px-4 py-2 text-sm"
            />
            <button className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white">Search</button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {visibleReviews.length === 0 ? (
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-10 text-center text-gray-600">No reviews found.</CardContent>
          </Card>
        ) : (
          visibleReviews.map((review) => (
            <Card key={`${review.kind}-${review.id}`} className="rounded-[1.75rem] border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-extrabold text-gray-900">{review.rating || 0}/5</div>
                    <div className="mt-4 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <div className="font-semibold text-gray-500">From</div>
                        <div className="mt-1 text-gray-900">{review.from?.name || review.userName || "N/A"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">To</div>
                        <div className="mt-1 text-gray-900">{review.to?.name || "Platform"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Workspace</div>
                        <div className="mt-1 text-gray-900">{review.workspaceLabel}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Created</div>
                        <div className="mt-1 text-gray-900">{formatAdminDate(review.createdAt)}</div>
                      </div>
                      <div className="md:col-span-2 xl:col-span-4">
                        <div className="font-semibold text-gray-500">Comment</div>
                        <div className="mt-1 line-clamp-3 text-gray-900">{review.publicComment || review.comment || "No comment left."}</div>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/admin/reviews/${review.id}?kind=${kind}`}
                    className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    View review
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {filteredReviews.length > pageSize ? (
        <div className="flex items-center justify-center gap-3">
          <a href={pageHref(Math.max(1, safePage - 1))} className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700">
            Previous
          </a>
          <div className="text-sm font-semibold text-gray-600">
            Page {safePage} of {totalPages}
          </div>
          <a href={pageHref(Math.min(totalPages, safePage + 1))} className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700">
            Next
          </a>
        </div>
      ) : null}
    </div>
  )
}
