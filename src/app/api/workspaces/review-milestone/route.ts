import { NextResponse } from "next/server"
import { getAdminDb, getAdminApp } from "@/lib/firebaseAdmin"
import { FieldValue } from "firebase-admin/firestore"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"
import { notifyAdmins } from "@/lib/notifications/notifyAdmins"
import { getWorkspaceNotificationContext } from "@/lib/notifications/context"

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

    const { workspaceId, milestoneId, decision } = await req.json()

    if (!workspaceId || !milestoneId || !decision) {
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

    // Update milestone approval
    const milestoneRef = workspaceRef.collection("milestones").doc(milestoneId)
    const milestone = (await milestoneRef.get()).data()

    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 })
    }

    const status = decision === "approved" ? "approved" : "rejected"
    await milestoneRef.update({
      status: status,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: userId,
    })

    // Notify talent
    const notificationTitle = decision === "approved" ? "Milestone approved" : "Milestone rejected"
    const notificationMessage = decision === "approved"
      ? "Your milestone submission has been approved"
      : "Your milestone submission needs revision"

    const context = await getWorkspaceNotificationContext(workspaceId)

    await notifyUser({
      userId: workspace.talentUid,
      type: "milestone_approval",
      title: notificationTitle,
      message:
        decision === "approved"
          ? `${context?.clientName || "Client"} approved your milestone for ${context?.gigTitle || "this workspace"}.`
          : `${context?.clientName || "Client"} requested revisions on your milestone for ${context?.gigTitle || "this workspace"}.`,
      link: `/dashboard/workspaces/${workspaceId}`,
    })

    // admin notification
    await notifyAdmins({
      type: "admin:workspace",
      title: `Milestone ${status}`,
      message: `${context?.clientName || "Client"} ${status} milestone ${milestoneId} in ${context?.gigTitle || "a workspace"} with ${context?.talentName || "the talent"}.`,
      link: `/admin/workspaces/${workspaceId}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Review milestone error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
