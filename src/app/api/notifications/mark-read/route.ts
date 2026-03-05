import { getAdminDb, getAdminApp } from "@/lib/firebaseAdmin"
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

  const { notificationId } = await req.json()

  if (!notificationId) {
    return NextResponse.json({ error: "Missing notificationId" }, { status: 400 })
  }

  // Verify the notification belongs to the user
  const notificationRef = adminDb.collection("notifications").doc(notificationId)
  const notification = (await notificationRef.get()).data()

  if (!notification || notification.userId !== userId) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 })
  }

  await notificationRef.update({ read: true })

  return NextResponse.json({ success: true })
}