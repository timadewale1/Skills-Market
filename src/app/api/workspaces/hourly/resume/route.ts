import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebaseAdmin"
import { getAdminDb } from "@/lib/firebaseAdmin"

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
      return NextResponse.json({ error: "Access denied - only talent can resume work" }, { status: 403 })
    }

    // Get session
    const sessionRef = wsRef.collection("hourly").doc("session")
    const sessionSnap = await sessionRef.get()

    if (!sessionSnap.exists || sessionSnap.data()?.status !== "paused") {
      return NextResponse.json({ error: "Work is not paused" }, { status: 400 })
    }

    // Resume work
    await sessionRef.update({
      status: "running",
      lastResumedAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
    })

  } catch (error: any) {
    console.error("Error resuming work:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}