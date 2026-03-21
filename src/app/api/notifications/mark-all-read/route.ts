import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const adminDb = getAdminDb()
  const adminApp = getAdminApp()

  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const decoded = await adminApp.auth().verifyIdToken(token)
  const userId = decoded.uid

  const unreadSnap = await adminDb
    .collection("notifications")
    .where("userId", "==", userId)
    .where("read", "==", false)
    .get()

  const batch = adminDb.batch()
  unreadSnap.docs.forEach((notificationDoc: any) => {
    batch.update(notificationDoc.ref, { read: true })
  })
  await batch.commit()

  return NextResponse.json({ success: true, updated: unreadSnap.size })
}
