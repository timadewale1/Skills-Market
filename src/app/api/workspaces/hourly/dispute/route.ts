import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebaseAdmin"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"

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

    const { wsId, checkinId, reason } = await request.json()

    if (!wsId || !checkinId || !reason?.trim()) {
      return NextResponse.json({ error: "Workspace ID, checkin ID, and reason are required" }, { status: 400 })
    }

    // Verify workspace exists and user is client
    const wsRef = db.collection("workspaces").doc(wsId)
    const wsSnap = await wsRef.get()

    if (!wsSnap.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const wsData = wsSnap.data()
    if (wsData?.clientUid !== userId) {
      return NextResponse.json({ error: "Access denied - only client can dispute checkins" }, { status: 403 })
    }

    // Get checkin
    const checkinRef = wsRef.collection("hourly").doc("session").collection("checkins").doc(checkinId)
    const checkinSnap = await checkinRef.get()

    if (!checkinSnap.exists) {
      return NextResponse.json({ error: "Check-in not found" }, { status: 404 })
    }

    const checkinData = checkinSnap.data()
    if (checkinData?.status !== "submitted") {
      return NextResponse.json({ error: "Check-in is not in submitted status" }, { status: 400 })
    }

    // Update checkin with dispute
    await checkinRef.update({
      status: "disputed",
      dispute: {
        reason: reason.trim(),
        at: new Date(),
        byUid: userId,
      },
      updatedAt: new Date(),
    })

    // Send notification to talent
    await notifyUser({
      userId: wsData.talentUid,
      type: "workspace",
      title: "Hourly Check-in Disputed",
      message: `Client disputed your check-in for hour ${checkinData.hourIndex + 1} in "${wsData.gigTitle || 'workspace'}"`,
      link: `/dashboard/workspaces/${wsId}`,
      emailSubject: "Your Check-in Has Been Disputed",
      emailHtml: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Check-in Disputed</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #fef7ed; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(249, 115, 22, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">
                ⚠️ changeworker
              </h1>
              <p style="color: #fed7aa; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
                Check-in Disputed
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <div style="background: linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #f97316 100%); border-radius: 8px; padding: 3px; margin-bottom: 30px;">
                <div style="background: #ffffff; border-radius: 6px; padding: 25px;">
                  <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 24px; font-weight: 600;">
                    🚩 Check-in Disputed
                  </h2>
                  <p style="color: #475569; margin: 0; font-size: 16px; line-height: 1.6;">
                    Your client has disputed your check-in for <strong>hour ${checkinData.hourIndex + 1}</strong>.
                  </p>
                  <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <p style="margin: 0; color: #991b1b; font-weight: 600; font-size: 14px;">
                      Reason: ${reason.trim()}
                    </p>
                  </div>
                  <p style="color: #475569; margin: 15px 0 0 0; font-size: 16px; line-height: 1.6;">
                    You can submit a defense or review the dispute details in your workspace.
                  </p>
                </div>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://changeworker.vercel.app/dashboard/workspaces/${wsId}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4);">
                  🛡️ View Workspace
                </a>
              </div>

              <div style="background: #fef3c7; border-left: 4px solid #f97316; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  💡 <strong>Next steps:</strong> Review the dispute and submit a defense if you believe the check-in is accurate. Communication is key to resolving this quickly.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #1e293b; padding: 30px; text-align: center;">
              <p style="color: #94a3b8; margin: 0 0 15px 0; font-size: 14px;">
                This workspace notification was sent by changeworker
              </p>
              <div style="border-top: 1px solid #334155; padding-top: 20px; margin-top: 20px;">
                <p style="color: #64748b; margin: 0; font-size: 12px;">
                  © 2024 changeworker. All rights reserved.<br>
                  <a href="https://changeworker.vercel.app" style="color: #f97316; text-decoration: none;">Visit our platform</a> |
                  <a href="mailto:support@changeworker.com" style="color: #f97316; text-decoration: none;">Contact Support</a>
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    return NextResponse.json({
      success: true,
    })

  } catch (error: any) {
    console.error("Error disputing checkin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}