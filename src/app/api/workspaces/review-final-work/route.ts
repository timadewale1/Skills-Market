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

    const { workspaceId, decision } = await req.json()

    if (!workspaceId || !decision) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const workspaceRef = adminDb.collection("workspaces").doc(workspaceId)
    const workspace = (await workspaceRef.get()).data()

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    // Check if user is client
    if (workspace.clientUid !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update final work approval
    const finalWorkRef = workspaceRef.collection("finalWork").doc("submission")
    const status = decision === "approved" ? "approved" : "rejected"
    
    await finalWorkRef.update({
      status: status,
      approvedAt: FieldValue.serverTimestamp(),
      approvedBy: userId,
    })

    // If approved, update workspace status to completed
    if (decision === "approved") {
      await workspaceRef.update({
        status: "completed",
        completedAt: FieldValue.serverTimestamp(),
        finalWorkApproved: true,
      })
    }

    // Notify talent
    const notificationTitle = decision === "approved" ? "Final work approved" : "Final work rejected"
    const notificationMessage = decision === "approved"
      ? "Your final work has been approved! The workspace is now complete"
      : "Your final work needs revision"

    await notifyUser({
      userId: workspace.talentUid,
      type: "final_work_approval",
      title: notificationTitle,
      message: notificationMessage,
      link: `/dashboard/workspaces/${workspaceId}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Review final work error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}