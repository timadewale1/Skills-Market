import Link from "next/link"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { formatAdminDate } from "@/lib/adminData"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ threadId: string }>
}

async function getThreadDetail(threadId: string) {
  const db = getAdminDb()
  const [threadSnap, messagesSnap, agreementSnap] = await Promise.all([
    db.collection("threads").doc(threadId).get(),
    db.collection("threads").doc(threadId).collection("messages").orderBy("createdAt", "asc").get(),
    db.collection("threads").doc(threadId).collection("agreement").doc("current").get(),
  ])

  if (!threadSnap.exists) return null
  return {
    id: threadSnap.id,
    ...(threadSnap.data() as any),
    messages: messagesSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })),
    agreement: agreementSnap.exists ? (agreementSnap.data() as any) : null,
  }
}

export default async function AdminThreadDetailPage({ params }: PageProps) {
  const { threadId } = await params
  const thread: any = await getThreadDetail(threadId)

  if (!thread) {
    return (
      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="p-10 text-center text-gray-600">Conversation not found.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Conversation detail"
        title={thread.gigTitle || "Message thread"}
        description="Read the full thread between client and talent in a view-only admin conversation screen."
        actions={
          <Link
            href="/admin/messages"
            className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
          >
            Back to messages
          </Link>
        }
        stats={[
          { label: "Client", value: thread.clientName || thread.clientUid || "N/A" },
          { label: "Talent", value: thread.talentName || thread.talentUid || "N/A" },
          { label: "Messages", value: thread.messages.length },
          { label: "Created", value: formatAdminDate(thread.createdAt) },
        ]}
      />

      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-extrabold">Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {thread.messages.length === 0 ? (
            <div className="text-sm text-gray-600">No messages in this thread yet.</div>
          ) : (
            thread.messages.map((message: any) => {
              const fromClient = message.fromUid === thread.clientUid
              const senderName = fromClient
                ? thread.clientName || thread.clientUid
                : message.fromUid === thread.talentUid
                  ? thread.talentName || thread.talentUid
                  : message.fromUid

              return (
                <div key={message.id} className="rounded-2xl border bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-extrabold text-gray-900">{senderName}</div>
                    <div className="text-xs font-semibold text-gray-500">{formatAdminDate(message.createdAt, true)}</div>
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                    {message.text || "No message body"}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
      {thread.agreement ? (
        <Card className="rounded-[1.75rem] border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-extrabold">Signed agreement</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <div className="font-semibold text-gray-500">Status</div>
              <div className="mt-1 text-gray-900">{thread.agreement.status || "draft"}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-500">Payment</div>
              <div className="mt-1 text-gray-900">
                {thread.agreement.terms?.amountAgreed ? `N${Number(thread.agreement.terms.amountAgreed).toLocaleString()}` : "N/A"}
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="font-semibold text-gray-500">Scope of work</div>
              <div className="mt-1 whitespace-pre-wrap text-gray-700">{thread.agreement.terms?.scopeOfWork || "No scope saved."}</div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
