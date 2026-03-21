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

    const { wsId, hourIndex } = await request.json()
    if (!wsId || hourIndex === undefined) {
      return NextResponse.json({ error: "wsId and hourIndex required" }, { status: 400 })
    }

    const wsRef = db.collection("workspaces").doc(wsId)
    const wsSnap = await wsRef.get()
    if (!wsSnap.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const wsData = wsSnap.data()
    if (wsData?.talentUid !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const hourNum = (hourIndex || 0) + 1
    const ordinal =
      hourNum.toString().match(/1$/) ? "st" : hourNum.toString().match(/2$/) ? "nd" : hourNum.toString().match(/3$/) ? "rd" : "th"

    await notifyUser({
      userId,
      type: "workspace",
      title: "Hour Complete - Submit Check-In",
      message: `Your ${hourNum}${ordinal} hour on "${wsData?.gigTitle || "your gig"}" is complete. You have 10 minutes to submit your check-in before the hour is not counted for pay.`,
      link: `/dashboard/workspaces/${wsId}`,
      emailSubject: `Hour ${hourNum} Complete - Submit Check-In`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending hour-complete notification:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
