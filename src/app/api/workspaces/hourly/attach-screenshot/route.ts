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

    const { wsId, checkinId, rawStoragePath, contentType } = await request.json()

    if (!wsId || !checkinId || !rawStoragePath) {
      return NextResponse.json({ error: "Workspace ID, checkin ID, and storage path are required" }, { status: 400 })
    }

    // Verify workspace exists and user is talent
    const wsRef = db.collection("workspaces").doc(wsId)
    const wsSnap = await wsRef.get()

    if (!wsSnap.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const wsData = wsSnap.data()
    if (wsData?.talentUid !== userId) {
      return NextResponse.json({ error: "Access denied - only talent can attach screenshots" }, { status: 403 })
    }

    // Get checkin
    const checkinRef = wsRef.collection("hourly").doc("session").collection("checkins").doc(checkinId)
    const checkinSnap = await checkinRef.get()

    if (!checkinSnap.exists) {
      return NextResponse.json({ error: "Check-in not found" }, { status: 404 })
    }

    const checkinData = checkinSnap.data()
    if (checkinData?.byUid !== userId) {
      return NextResponse.json({ error: "Access denied - not your check-in" }, { status: 403 })
    }

    // Generate preview path (assuming server-side processing would create this)
    // For now, we'll just store the raw path and let the client handle preview generation
    const previewPath = rawStoragePath.replace('/raw/', '/previews/').replace(/\.[^.]+$/, '_preview.jpg')

    await checkinRef.update({
      screenshotPreviewPath: previewPath,
      screenshotPreviewUrl: previewPath, // This would be the signed URL in production
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      previewPath,
    })

  } catch (error: any) {
    console.error("Error attaching screenshot:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}