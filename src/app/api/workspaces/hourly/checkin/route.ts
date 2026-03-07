import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebaseAdmin"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"
import { notifyAdmins } from "@/lib/notifications/notifyAdmins"

export async function POST(request: NextRequest) {
  try {
    const auth = getAdminAuth()
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
      emailHtml: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Check-in Submitted</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #fef7ed; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(249, 115, 22, 0.1);">
    })
        </body>
        </html>
      `,
    })

    // notify admins
    await notifyAdmins({
      type: "admin:workspace",
      title: "Check-in Submitted",
      message: `A check-in was submitted for workspace ${wsId} hour ${currentHourIndex + 1}`,
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
