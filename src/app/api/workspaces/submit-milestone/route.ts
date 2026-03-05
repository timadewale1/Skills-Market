import { NextResponse } from "next/server"
import { getAdminDb, getAdminApp } from "@/lib/firebaseAdmin"
import { FieldValue } from "firebase-admin/firestore"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"

export async function POST(req: Request) {
  try {
    const adminDb = getAdminDb()
    const adminApp = getAdminApp()

    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const decoded = await adminApp.auth().verifyIdToken(token)
    const userId = decoded.uid

    const { workspaceId, milestoneId, status } = await req.json()

    if (!workspaceId || !milestoneId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const workspaceRef = adminDb.collection("workspaces").doc(workspaceId)
    const workspace = (await workspaceRef.get()).data()

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // Check if user is talent
    if (workspace.talentUid !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update milestone status
    const milestoneRef = workspaceRef.collection("milestones").doc(milestoneId)
    await milestoneRef.update({
      status: status || "submitted",
      submittedAt: FieldValue.serverTimestamp(),
    })

    // Notify client
    await notifyUser({
      userId: workspace.clientUid,
      type: "milestone_submission",
      title: "Milestone submitted",
      message: "Talent has submitted a milestone for review",
      link: `/dashboard/workspaces/${workspaceId}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Submit milestone error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}