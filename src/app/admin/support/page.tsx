import Link from "next/link"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { formatAdminDate } from "@/lib/adminData"

export const dynamic = "force-dynamic"

type SupportThread = {
  id: string
  createdByName?: string
  createdByRole?: string
  lastMessageText?: string
  status?: string
  unreadByAdmin?: boolean
  updatedAt?: any
}

type PageProps = {
  searchParams?: Promise<{ q?: string; page?: string }>
}

async function getSupportThreads() {
  const db = getAdminDb()
  const snap = await db.collection("supportThreads").orderBy("updatedAt", "desc").get()
  return snap.docs.map((threadDoc: any) => ({ id: threadDoc.id, ...(threadDoc.data() as any) }))
}

export default async function AdminSupportPage({ searchParams }: PageProps) {
  const threads: SupportThread[] = await getSupportThreads()
  const resolvedSearchParams = (await searchParams) || {}
  const q = String(resolvedSearchParams.q || "").trim().toLowerCase()
  const page = Math.max(1, Number(resolvedSearchParams.page || 1))
  const pageSize = 10

  const filtered = threads.filter((thread: SupportThread) => {
    if (!q) return true
    const blob = `${thread.createdByName || ""} ${thread.createdByRole || ""} ${thread.lastMessageText || ""}`.toLowerCase()
    return blob.includes(q)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const paramsFor = (nextPage: number) => {
    const params = new URLSearchParams()
    if (resolvedSearchParams.q) params.set("q", String(resolvedSearchParams.q))
    if (nextPage > 1) params.set("page", String(nextPage))
    const query = params.toString()
    return query ? `/admin/support?${query}` : "/admin/support"
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Support inbox"
        title="Dashboard support requests"
        description="Read help requests coming from the dashboard assistant and reply directly to users."
        stats={[
          { label: "Threads", value: filtered.length },
          { label: "Open", value: filtered.filter((thread) => thread.status !== "closed").length },
          { label: "Unread", value: filtered.filter((thread) => thread.unreadByAdmin).length },
          { label: "Source", value: "Dashboard" },
        ]}
      />

      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="p-6">
          <form action="/admin/support" className="flex gap-3">
            <input
              name="q"
              defaultValue={resolvedSearchParams.q || ""}
              placeholder="Search by user, role, or message"
              className="w-full rounded-full border px-4 py-2 text-sm"
            />
            <button className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white">Search</button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {visible.length === 0 ? (
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-10 text-center text-gray-600">No support requests found.</CardContent>
          </Card>
        ) : (
          visible.map((thread: SupportThread) => (
            <Card key={thread.id} className="rounded-[1.75rem] border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <div className="font-semibold text-gray-500">User</div>
                        <div className="mt-1 font-semibold text-gray-900">{thread.createdByName || "Unknown user"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Role</div>
                        <div className="mt-1 text-gray-900">{thread.createdByRole || "N/A"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Latest message</div>
                        <div className="mt-1 text-gray-900 line-clamp-2">{thread.lastMessageText || "No message yet"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Updated</div>
                        <div className="mt-1 text-gray-900">{formatAdminDate(thread.updatedAt, true)}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-gray-600">
                        {thread.status || "open"}
                      </span>
                      {thread.unreadByAdmin ? (
                        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                          Needs reply
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <Link
                    href={`/admin/support/${thread.id}`}
                    className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Open support chat
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {filtered.length > pageSize ? (
        <div className="flex items-center justify-center gap-3">
          <Link href={paramsFor(Math.max(1, safePage - 1))} className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700">
            Previous
          </Link>
          <div className="text-sm font-semibold text-gray-600">Page {safePage} of {totalPages}</div>
          <Link href={paramsFor(Math.min(totalPages, safePage + 1))} className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700">
            Next
          </Link>
        </div>
      ) : null}
    </div>
  )
}
