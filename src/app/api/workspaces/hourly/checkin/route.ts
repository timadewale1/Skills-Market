import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"
import { notifyAdmins } from "@/lib/notifications/notifyAdmins"

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

    const { wsId, note } = await request.json()
    if (!wsId || !note?.trim()) {
      return NextResponse.json({ error: "Workspace ID and note are required" }, { status: 400 })
    }

    const wsRef = db.collection("workspaces").doc(wsId)
    const wsSnap = await wsRef.get()
    if (!wsSnap.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const wsData = wsSnap.data()
    if (wsData?.talentUid !== userId) {
      return NextResponse.json({ error: "Access denied - only talent can submit checkins" }, { status: 403 })
    }

    const agreementRef = db.doc(`threads/${wsData.threadId}/agreement/current`)
    const agreementSnap = await agreementRef.get()
    const agreement = agreementSnap.exists ? agreementSnap.data() : null
    if (agreement?.terms?.payType !== "hourly") {
      return NextResponse.json({ error: "This workspace is not hourly-based" }, { status: 400 })
    }

    const sessionRef = wsRef.collection("hourly").doc("session")
    const sessionSnap = await sessionRef.get()
    if (!sessionSnap.exists) {
      return NextResponse.json({ error: "No hourly session found" }, { status: 400 })
    }

    const sessionData = sessionSnap.data()
    const currentHourIndex = sessionData?.currentHourIndex || 0
    const checkinsRef = sessionRef.collection("checkins")
    const existingCheckinQuery = await checkinsRef
      .where("hourIndex", "==", currentHourIndex)
      .where("byUid", "==", userId)
      .get()

    if (!existingCheckinQuery.empty) {
      return NextResponse.json({ error: "Check-in already submitted for this hour" }, { status: 400 })
    }

    const checkinRef = await checkinsRef.add({
      hourIndex: currentHourIndex,
      note: note.trim(),
      status: "submitted",
      submittedAt: new Date(),
      byUid: userId,
    })

    await notifyUser({
      userId: wsData.clientUid,
      type: "workspace",
      title: "Hourly Check-in Submitted",
      message: `Talent submitted a check-in for hour ${currentHourIndex + 1} in "${wsData.gigTitle || "workspace"}".`,
      link: `/dashboard/workspaces/${wsId}`,
      emailSubject: "Hourly Check-in Submitted",
    })

    await notifyUser({
      userId: wsData.talentUid,
      type: "workspace",
      title: "Check-in Submitted Successfully",
      message: `Your check-in for hour ${currentHourIndex + 1} has been submitted in "${wsData.gigTitle || "workspace"}".`,
      link: `/dashboard/workspaces/${wsId}`,
    })

    await notifyAdmins({
      type: "admin:workspace",
      title: "Check-in Submitted",
      message: `A check-in was submitted for ${wsData.gigTitle || "a workspace"} for hour ${currentHourIndex + 1}.`,
      link: `/admin/workspaces/${wsId}`,
    })

    return NextResponse.json({
      success: true,
      checkinId: checkinRef.id,
      hourIndex: currentHourIndex,
    })
  } catch (error: any) {
    console.error("Error creating hourly checkin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
