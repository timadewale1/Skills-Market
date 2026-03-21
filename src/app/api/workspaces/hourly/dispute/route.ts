import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"

export async function POST(request: NextRequest) {
  try {
    const auth = getAdminAuth()
    const db = getAdminDb()

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    const { wsId, checkinId, reason } = await request.json()
    if (!wsId || !checkinId || !reason?.trim()) {
      return NextResponse.json({ error: "Workspace ID, checkin ID, and reason are required" }, { status: 400 })
    }

    const wsRef = db.collection("workspaces").doc(wsId)
    const wsSnap = await wsRef.get()
    if (!wsSnap.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const wsData = wsSnap.data()
    if (wsData?.clientUid !== userId) {
      return NextResponse.json({ error: "Access denied - only client can dispute checkins" }, { status: 403 })
    }

    const checkinRef = wsRef.collection("hourly").doc("session").collection("checkins").doc(checkinId)
    const checkinSnap = await checkinRef.get()
    if (!checkinSnap.exists) {
      return NextResponse.json({ error: "Check-in not found" }, { status: 404 })
    }

    const checkinData = checkinSnap.data()
    if (checkinData?.status !== "submitted") {
      return NextResponse.json({ error: "Check-in is not in submitted status" }, { status: 400 })
    }

    await checkinRef.update({
      status: "disputed",
      dispute: {
        reason: reason.trim(),
        at: new Date(),
        byUid: userId,
      },
      updatedAt: new Date(),
    })

    await notifyUser({
      userId: wsData.talentUid,
      type: "workspace",
      title: "Hourly Check-in Disputed",
      message: `Client disputed your check-in for hour ${checkinData.hourIndex + 1} in "${wsData.gigTitle || "workspace"}". Reason: ${reason.trim()}`,
      link: `/dashboard/workspaces/${wsId}`,
      emailSubject: "Your Check-in Has Been Disputed",
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error disputing checkin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
