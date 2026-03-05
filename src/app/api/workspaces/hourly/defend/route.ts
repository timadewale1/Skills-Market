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

    const { wsId, checkinId, note } = await request.json()

    if (!wsId || !checkinId || !note?.trim()) {
      return NextResponse.json({ error: "Workspace ID, checkin ID, and note are required" }, { status: 400 })
    }

    // Verify workspace exists and user is talent
    const wsRef = db.collection("workspaces").doc(wsId)
    const wsSnap = await wsRef.get()

    if (!wsSnap.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const wsData = wsSnap.data()
    if (wsData?.talentUid !== userId) {
      return NextResponse.json({ error: "Access denied - only talent can defend checkins" }, { status: 403 })
    }

    // Get checkin
    const checkinRef = wsRef.collection("hourly").doc("session").collection("checkins").doc(checkinId)
    const checkinSnap = await checkinRef.get()

    if (!checkinSnap.exists) {
      return NextResponse.json({ error: "Check-in not found" }, { status: 404 })
    }

    const checkinData = checkinSnap.data()
    if (checkinData?.status !== "disputed") {
      return NextResponse.json({ error: "Check-in is not disputed" }, { status: 400 })
    }

    // Update checkin with defense
    await checkinRef.update({
      defense: {
        note: note.trim(),
        at: new Date(),
        byUid: userId,
      },
      updatedAt: new Date(),
    })

    // Send notification to client
    await notifyUser({
      userId: wsData.clientUid,
      type: "workspace",
      title: "Hourly Check-in Defended",
      message: `Talent defended their disputed check-in for hour ${checkinData.hourIndex + 1} in "${wsData.gigTitle || 'workspace'}"`,
      link: `/dashboard/workspaces/${wsId}`,
      emailSubject: "Talent Submitted Defense for Disputed Check-in",
      emailHtml: `<p>Your talent has submitted a defense for their disputed check-in for hour ${checkinData.hourIndex + 1}.</p><p><strong>Defense:</strong> ${note.trim()}</p><p>You can review the defense and decide how to proceed.</p><p><a href="https://skills-market.vercel.app/dashboard/workspaces/${wsId}">Review Defense</a></p>`,
    })

    return NextResponse.json({
      success: true,
    })

  } catch (error: any) {
    console.error("Error defending checkin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}