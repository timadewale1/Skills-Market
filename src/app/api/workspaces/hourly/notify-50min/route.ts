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
      title: "Hour Check-In Reminder",
      message: `Your ${hourNum}${ordinal} hour on "${wsData?.gigTitle || "your gig"}" is almost complete. Remember to submit your check-in before the hour ends.`,
      link: `/dashboard/workspaces/${wsId}`,
      emailSubject: `Time to Check In - Hour ${hourNum} Almost Complete`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error sending 50-min notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
