import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
import AdminSupportReplyComposer from "@/components/admin/AdminSupportReplyComposer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { formatAdminDate } from "@/lib/adminData"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ threadId: string }>
}

async function getSupportThread(threadId: string) {
  const db = getAdminDb()
  const threadRef = db.collection("supportThreads").doc(threadId)
  const [threadSnap, messagesSnap] = await Promise.all([
    threadRef.get(),
    threadRef.collection("messages").orderBy("createdAt", "asc").get(),
  ])

  if (!threadSnap.exists) return null

  await threadRef.set({ unreadByAdmin: false }, { merge: true })

  return {
    id: threadSnap.id,
    ...(threadSnap.data() as any),
    messages: messagesSnap.docs.map((messageDoc: any) => ({ id: messageDoc.id, ...(messageDoc.data() as any) })),
  }
}

export default async function AdminSupportThreadPage({ params }: PageProps) {
  const { threadId } = await params
  const thread: any = await getSupportThread(threadId)

  if (!thread) {
    return (
      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="p-10 text-center text-gray-600">Support thread not found.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Support conversation"
        title={thread.createdByName || "Support thread"}
        description="Read the dashboard support conversation and reply back to the user from the admin side."
        actions={
          <Link
            href="/admin/support"
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
          >
            <ArrowLeft size={16} />
            Back to support
          </Link>
        }
        stats={[
          { label: "Role", value: thread.createdByRole || "N/A" },
          { label: "Email", value: thread.createdByEmail || "N/A" },
          { label: "Messages", value: thread.messages.length },
          { label: "Updated", value: formatAdminDate(thread.updatedAt, true) },
        ]}
      />

      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-extrabold">Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {thread.messages.length === 0 ? (
            <div className="text-sm text-gray-600">No messages yet.</div>
          ) : (
            thread.messages.map((message: any) => (
              <div key={message.id} className="rounded-2xl border bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-extrabold text-gray-900">
                    {message.senderName || (message.senderRole === "admin" ? "Admin support" : thread.createdByName || "User")}
                  </div>
                  <div className="text-xs font-semibold text-gray-500">{formatAdminDate(message.createdAt, true)}</div>
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                  {message.senderRole || "user"}
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-700">{message.text || "No message body"}</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <AdminSupportReplyComposer threadId={thread.id} />
    </div>
  )
}
