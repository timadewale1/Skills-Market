import { getAdminDb } from "@/lib/firebaseAdmin"
import { FieldValue } from "firebase-admin/firestore"

export async function sendNotification({
  userId,
  type,
  title,
  message,
  link,
  meta = {},
}: {
  userId: string
  type: string
  title: string
  message: string
  link?: string
  meta?: any
}) {

  const adminDb = getAdminDb()
  await adminDb.collection("notifications").add({
    userId,
    type,
    title,
    message,
    link: link || null,
    meta,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  })
}