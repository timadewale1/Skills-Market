import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "firebase-admin/auth"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"

export async function POST(request: NextRequest) {
  try {
    const auth = getAuth()
    const db = getAdminDb()

    // Verify authentication
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

    // Verify workspace exists and user is talent
    const wsRef = db.collection("workspaces").doc(wsId)
    const wsSnap = await wsRef.get()

    if (!wsSnap.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const wsData = wsSnap.data()
    if (wsData?.talentUid !== userId) {
      return NextResponse.json({ error: "Access denied - only talent can submit checkins" }, { status: 403 })
    }

    // Check if workspace is hourly
    const threadRef = db.collection("threads").doc(wsData.threadId)
    const threadSnap = await threadRef.get()
    const agreement = threadSnap.exists ? threadSnap.data() : null

    if (agreement?.terms?.payType !== "hourly") {
      return NextResponse.json({ error: "This workspace is not hourly-based" }, { status: 400 })
    }

    // Get current session
    const sessionRef = wsRef.collection("hourly").doc("session")
    const sessionSnap = await sessionRef.get()

    if (!sessionSnap.exists || sessionSnap.data()?.status !== "running") {
      return NextResponse.json({ error: "Hourly session is not running" }, { status: 400 })
    }

    const sessionData = sessionSnap.data()
    const currentHourIndex = sessionData?.currentHourIndex || 0

    // Check if already submitted for this hour
    const checkinsRef = sessionRef.collection("checkins")
    const existingCheckinQuery = await checkinsRef
      .where("hourIndex", "==", currentHourIndex)
      .where("byUid", "==", userId)
      .get()

    if (!existingCheckinQuery.empty) {
      return NextResponse.json({ error: "Check-in already submitted for this hour" }, { status: 400 })
    }

    // Create checkin
    const checkinRef = await checkinsRef.add({
      hourIndex: currentHourIndex,
      note: note.trim(),
      status: "submitted",
      submittedAt: new Date(),
      byUid: userId,
    })

    // Send notification to client
    await notifyUser({
      userId: wsData.clientUid,
      type: "workspace",
      title: "Hourly Check-in Submitted",
      message: `Talent submitted check-in for hour ${currentHourIndex + 1} in "${wsData.gigTitle || 'workspace'}"`,
      link: `/dashboard/workspaces/${wsId}`,
      emailSubject: "Hourly Check-in Submitted",
      emailHtml: `<p>Your talent has submitted a check-in for hour ${currentHourIndex + 1} in <strong>${wsData.gigTitle || 'workspace'}</strong>.</p><p>Note: ${note.trim()}</p><p><a href="https://skills-market.vercel.app/dashboard/workspaces/${wsId}">Review Check-in</a></p>`,
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