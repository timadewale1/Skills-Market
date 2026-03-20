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

    const { wsId, notes, attachments, isResubmit } = await request.json()

    if (!wsId || !notes?.trim() || !attachments) {
      return NextResponse.json({ error: "Workspace ID, notes, and attachments are required" }, { status: 400 })
    }

    // Verify workspace exists and user is talent
    const wsRef = db.collection("workspaces").doc(wsId)
    const wsSnap = await wsRef.get()

    if (!wsSnap.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const wsData = wsSnap.data()
    if (wsData?.talentUid !== userId) {
      return NextResponse.json({ error: "Access denied - only talent can submit final work" }, { status: 403 })
    }

    // Check if already submitted
    const finalWorkRef = wsRef.collection("finalWork").doc("submission")
    const existingSnap = await finalWorkRef.get()
    if (existingSnap.exists) {
      const existingData = existingSnap.data()

      // RESUBMISSION: Delete old submission completely and start fresh
      if (isResubmit === true && existingData?.status === "declined") {
        console.log("[final-work/submit] Resubmission: Deleting old submission and starting fresh")
        // Delete the old document completely
        await finalWorkRef.delete()
        // Then create fresh new submission below (falls through to create logic)
      } else if (!isResubmit) {
        // RETRY (same submission, missing files): Merge new attachments with existing ones
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
        console.log("[final-work/submit] Retry: Merged new raw files with existing previews")
        return NextResponse.json({ success: true, updated: true })
      }
    }

    // Create final work submission
    // Set with merge:true so CF previews aren't lost (CF will add previews via arrayUnion)
    await finalWorkRef.set(
      {
        status: "submitted",
        submittedBy: userId,
        submittedAt: new Date(),
        notes: notes.trim(),
        attachments: attachments,
        downloadableAfter: "approved",
        updatedAt: new Date(),
      },
      { merge: true }
    )

    // Send notification to client
    await notifyUser({
      userId: wsData.clientUid,
      type: "workspace",
      title: "Final Work Submitted",
      message: `Talent submitted final work in "${wsData.gigTitle || 'workspace'}"`,
      link: `/dashboard/workspaces/${wsId}`,
      emailSubject: "Final Work Submitted",
      emailHtml: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Final Work Submitted</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #fef7ed; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(249, 115, 22, 0.1);">
            <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Final Work Submitted</h1>
              <p style="color: #fed7aa; margin: 10px 0 0 0; font-size: 16px;">Talent has completed and submitted their final deliverables</p>
            </div>
            <div style="padding: 40px 30px;">
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Submission Details</h2>
                <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Workspace:</strong> ${wsData.gigTitle || 'Untitled Workspace'}</p>
                <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;"><strong>Notes:</strong> ${notes.trim()}</p>
                <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;"><strong>Files:</strong> ${attachments.length} file(s) attached</p>
              </div>
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/workspaces/${wsId}" style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">Review Final Work</a>
              </div>
              <p style="margin: 20px 0 0 0; text-align: center; color: #9ca3af; font-size: 12px;">You can review the final deliverables and approve or request revisions in your workspace dashboard.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    // notify admins
    await notifyAdmins({
      type: "admin:workspace",
      title: "Final Work Submitted",
      message: `Final work submitted for workspace ${wsId}`,
      link: `/admin/workspaces/${wsId}`,
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Error submitting final work:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}