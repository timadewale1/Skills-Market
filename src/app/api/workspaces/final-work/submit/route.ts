import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"
import { notifyAdmins } from "@/lib/notifications/notifyAdmins"

export async function POST(request: NextRequest) {
  try {
    const auth = getAdminAuth()
    const db = getAdminDb()

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    const { wsId, notes, attachments, isResubmit } = await request.json()
    if (!wsId || !notes?.trim() || !attachments) {
      return NextResponse.json({ error: "Workspace ID, notes, and attachments are required" }, { status: 400 })
    }

    const wsRef = db.collection("workspaces").doc(wsId)
    const wsSnap = await wsRef.get()
    if (!wsSnap.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const wsData = wsSnap.data()
    if (wsData?.talentUid !== userId) {
      return NextResponse.json({ error: "Access denied - only talent can submit final work" }, { status: 403 })
    }

    const finalWorkRef = wsRef.collection("finalWork").doc("submission")
    const existingSnap = await finalWorkRef.get()

    if (existingSnap.exists) {
      const existingData = existingSnap.data()
      if (isResubmit === true && existingData?.status === "declined") {
        await finalWorkRef.delete()
      } else if (!isResubmit) {
        const existingPreviews = existingData?.attachments?.filter((a: any) => a.kind === "preview") || []
        const mergedAttachments = [...existingPreviews, ...attachments]

        await finalWorkRef.set(
          {
            status: "submitted",
            notes: notes.trim(),
            attachments: mergedAttachments,
            updatedAt: new Date(),
          },
          { merge: true }
        )

        return NextResponse.json({ success: true, updated: true })
      }
    }

    await finalWorkRef.set(
      {
        status: "submitted",
        submittedBy: userId,
        submittedAt: new Date(),
        notes: notes.trim(),
        attachments,
        downloadableAfter: "approved",
        updatedAt: new Date(),
      },
      { merge: true }
    )

    await notifyUser({
      userId: wsData.clientUid,
      type: "workspace",
      title: "Final Work Submitted",
      message: `Talent submitted final work in "${wsData.gigTitle || "workspace"}".`,
      link: `/dashboard/workspaces/${wsId}`,
      emailSubject: "Final Work Submitted",
    })

    await notifyAdmins({
      type: "admin:workspace",
      title: "Final Work Submitted",
      message: `Final work was submitted for ${wsData.gigTitle || "a workspace"}.`,
      link: `/admin/workspaces/${wsId}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error submitting final work:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
