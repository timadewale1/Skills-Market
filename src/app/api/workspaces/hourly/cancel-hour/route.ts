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

    const { wsId } = await request.json()
    if (!wsId) {
      return NextResponse.json({ error: "wsId required" }, { status: 400 })
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

    const sessionRef = db.collection("workspaces").doc(wsId).collection("hourly").doc("session")
    const sessionSnap = await sessionRef.get()
    if (!sessionSnap.exists) {
      return NextResponse.json({ error: "No active session" }, { status: 400 })
    }

    const sessionData = sessionSnap.data()
    const currentHourIdx = sessionData?.currentHourIndex || 0

    await sessionRef.update({
      cancelledHours: [...(sessionData?.cancelledHours || []), currentHourIdx],
      status: "paused",
    })

    const hourNum = currentHourIdx + 1
    const ordinal =
      hourNum.toString().match(/1$/) ? "st" : hourNum.toString().match(/2$/) ? "nd" : hourNum.toString().match(/3$/) ? "rd" : "th"

    await notifyUser({
      userId: wsData?.talentUid,
      type: "workspace",
      title: "Hour Not Counted - No Check-In",
      message: `Your ${hourNum}${ordinal} hour on "${wsData?.gigTitle || "your gig"}" was not counted because no check-in was submitted within 10 minutes.`,
      link: `/dashboard/workspaces/${wsId}`,
      emailSubject: `Hour ${hourNum} Not Counted`,
    })

    await notifyUser({
      userId: wsData?.clientUid,
      type: "workspace",
      title: "Hour Not Submitted",
      message: `The talent did not submit a check-in for hour ${hourNum} within the grace period, so this hour will not be counted.`,
      link: `/dashboard/workspaces/${wsId}`,
      emailSubject: `Talent Did Not Submit Check-In for Hour ${hourNum}`,
    })

    return NextResponse.json({ success: true, hourCancelled: currentHourIdx })
  } catch (error) {
    console.error("Error cancelling hour:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
