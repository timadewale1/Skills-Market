import { FieldValue } from "firebase-admin/firestore"
import { getAdminDb } from "@/lib/firebaseAdmin"

export type SupportThreadRecord = {
  createdByUid: string
  createdByRole: "talent" | "client"
  createdByName: string
  createdByEmail?: string | null
  status: "open" | "closed"
  subject: string
  source: "dashboard-help"
  lastMessageText: string
  lastMessageAt: any
  lastMessageBy: string
  unreadByAdmin: boolean
  unreadByUser: boolean
  createdAt: any
  updatedAt: any
}

export function makeSupportThreadId(userUid: string) {
  return `support_${userUid}`
}

export async function getSupportThreadForUser(userUid: string) {
  const db = getAdminDb()
  const ref = db.collection("supportThreads").doc(makeSupportThreadId(userUid))
  const snap = await ref.get()
  if (!snap.exists) return null

  const messagesSnap = await ref.collection("messages").orderBy("createdAt", "asc").get()
  return {
    id: snap.id,
    ...(snap.data() as any),
    messages: messagesSnap.docs.map((messageDoc: any) => ({ id: messageDoc.id, ...(messageDoc.data() as any) })),
  }
}

export async function ensureSupportThread(params: {
  userUid: string
  userRole: "talent" | "client"
  userName: string
  userEmail?: string | null
}) {
  const db = getAdminDb()
  const threadId = makeSupportThreadId(params.userUid)
  const ref = db.collection("supportThreads").doc(threadId)
  const snap = await ref.get()

  if (!snap.exists) {
    const payload: SupportThreadRecord = {
      createdByUid: params.userUid,
      createdByRole: params.userRole,
      createdByName: params.userName,
      createdByEmail: params.userEmail || null,
      status: "open",
      subject: `${params.userRole === "talent" ? "Talent" : "Client"} dashboard help`,
      source: "dashboard-help",
      lastMessageText: "Support conversation started",
      lastMessageAt: FieldValue.serverTimestamp(),
      lastMessageBy: params.userUid,
      unreadByAdmin: false,
      unreadByUser: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }
    await ref.set(payload)
  } else {
    await ref.set(
      {
        createdByRole: params.userRole,
        createdByName: params.userName,
        createdByEmail: params.userEmail || null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  }

  return threadId
}
