import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "firebase-admin/auth"
import { getAdminDb } from "@/lib/firebaseAdmin"

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

    const { wsId } = await request.json()

    if (!wsId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 })
    }

    // Verify workspace exists and user is talent
    const wsRef = db.collection("workspaces").doc(wsId)
    const wsSnap = await wsRef.get()

    if (!wsSnap.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const wsData = wsSnap.data()
    if (wsData?.talentUid !== userId) {
      return NextResponse.json({ error: "Access denied - only talent can start work" }, { status: 403 })
    }

    // Check payment status
    if (wsData?.paymentStatus !== "initiated" && wsData?.paymentStatus !== "funded") {
      return NextResponse.json({ error: "Client must complete payment step first" }, { status: 400 })
    }

    // Get or create session
    const sessionRef = wsRef.collection("hourly").doc("session")
    const sessionSnap = await sessionRef.get()

    if (sessionSnap.exists) {
      const sessionData = sessionSnap.data()
      if (sessionData?.status === "running") {
        return NextResponse.json({ error: "Work is already running" }, { status: 400 })
      }
    }

    // Start work
    await sessionRef.set({
      status: "running",
      startedAt: new Date(),
      lastResumedAt: new Date(),
      currentHourIndex: 0,
      currentHourStartedAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true })

    return NextResponse.json({
      success: true,
    })

  } catch (error: any) {
    console.error("Error starting work:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}