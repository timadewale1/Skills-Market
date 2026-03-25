import Link from "next/link"
import { getAdminDb } from "@/lib/firebaseAdmin"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { formatAdminDate } from "@/lib/adminData"

export const dynamic = "force-dynamic"

type MessagesPageProps = {
  searchParams?: Promise<{ q?: string; page?: string }>
}

async function getThreads() {
  const db = getAdminDb()
  const snap = await db.collection("threads").orderBy("createdAt", "desc").get()
  return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const threads: any[] = await getThreads()
  const resolvedSearchParams = (await searchParams) || {}
  const q = String(resolvedSearchParams.q || "").trim().toLowerCase()
  const page = Math.max(1, Number(resolvedSearchParams.page || 1))
  const pageSize = 10
  const filtered = threads.filter((thread) => {
    if (!q) return true
    const blob = `${thread.gigTitle || ""} ${thread.clientName || ""} ${thread.talentName || ""}`.toLowerCase()
    return blob.includes(q)
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const paramsFor = (nextPage: number) => {
    const params = new URLSearchParams()
    if (resolvedSearchParams.q) params.set("q", String(resolvedSearchParams.q))
    if (nextPage > 1) params.set("page", String(nextPage))
    const s = params.toString()
    return s ? `/admin/messages?${s}` : "/admin/messages"
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Conversation oversight"
        title="Messages and threads"
        description="Review relationship threads created across gigs and workspaces so admin can follow context when disputes, funding, or quality issues surface."
        stats={[
          { label: "Threads", value: filtered.length },
          { label: "Scope", value: "Client + talent" },
          { label: "View", value: "Metadata" },
          { label: "Latest", value: "Realtime" },
        ]}
      />

      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              Need dashboard help requests too? Open the admin support inbox for user-to-support conversations.
            </div>
            <Link
              href="/admin/support"
              className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
            >
              Open support inbox
            </Link>
          </div>
          <form action="/admin/messages" className="flex gap-3">
            <input
              name="q"
              defaultValue={resolvedSearchParams.q || ""}
              placeholder="Search by gig, client, or talent"
              className="w-full rounded-full border px-4 py-2 text-sm"
            />
            <button className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white">Search</button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {visible.length === 0 ? (
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-10 text-center text-gray-600">No threads found.</CardContent>
          </Card>
        ) : (
          visible.map((thread) => (
            <Card key={thread.id} className="rounded-[1.75rem] border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <div className="font-semibold text-gray-500">Thread</div>
                        <div className="mt-1 font-semibold text-gray-900">{thread.gigTitle || thread.id}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Client</div>
                        <div className="mt-1 text-gray-900">{thread.clientName || thread.clientUid || "N/A"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Talent</div>
                        <div className="mt-1 text-gray-900">{thread.talentName || thread.talentUid || "N/A"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Created</div>
                        <div className="mt-1 text-gray-900">{formatAdminDate(thread.createdAt, true)}</div>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/admin/messages/${thread.id}`}
                    className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    View conversation
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {filtered.length > pageSize ? (
        <div className="flex items-center justify-center gap-3">
          <Link href={paramsFor(Math.max(1, safePage - 1))} className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700">Previous</Link>
          <div className="text-sm font-semibold text-gray-600">Page {safePage} of {totalPages}</div>
          <Link href={paramsFor(Math.min(totalPages, safePage + 1))} className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700">Next</Link>
        </div>
      ) : null}
    </div>
  )
}
