import { NextResponse } from "next/server"
import { getAdminDb, getAdminApp } from "@/lib/firebaseAdmin"
import { FieldValue } from "firebase-admin/firestore"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"
import { notifyAdmins } from "@/lib/notifications/notifyAdmins"

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

    const { workspaceId } = await req.json()

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })
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

    // Update final work status
    await workspaceRef.collection("finalWork").doc("submission").update({
      status: "submitted",
      submittedAt: FieldValue.serverTimestamp(),
    })

    // Notify client
    await notifyUser({
      userId: workspace.clientUid,
      type: "final_submission",
      title: "Final work submitted",
      message: "Talent has submitted the final work for your review",
      link: `/dashboard/workspaces/${workspaceId}`,
    })

    // notify admins
    await notifyAdmins({
      type: "admin:workspace",
      title: "Final Work Submitted",
      message: `Final work in workspace ${workspaceId} has been submitted.",
      link: `/admin/workspaces/${workspaceId}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Submit final work error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}