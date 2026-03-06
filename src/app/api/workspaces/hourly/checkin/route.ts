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

    const { wsId, note } = await request.json()

    if (!wsId || !note?.trim()) {
      return NextResponse.json({ error: "Workspace ID and note are required" }, { status: 400 })
    }

    // Verify workspace exists and user is talent
    const wsRef = db.collection("workspaces").doc(wsId)
    const wsSnap = await wsRef.get()

    if (!wsSnap.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const wsData = wsSnap.data()
    if (wsData?.talentUid !== userId) {
      return NextResponse.json({ error: "Access denied - only talent can submit checkins" }, { status: 403 })
    }

    // Check if workspace is hourly
    const threadRef = db.collection("threads").doc(wsData.threadId)
    const threadSnap = await threadRef.get()
    const agreement = threadSnap.exists ? threadSnap.data() : null

    if (agreement?.terms?.payType !== "hourly") {
      return NextResponse.json({ error: "This workspace is not hourly-based" }, { status: 400 })
    }

    // Get current session
    const sessionRef = wsRef.collection("hourly").doc("session")
    const sessionSnap = await sessionRef.get()

    if (!sessionSnap.exists || sessionSnap.data()?.status !== "running") {
      return NextResponse.json({ error: "Hourly session is not running" }, { status: 400 })
    }

    const sessionData = sessionSnap.data()
    const currentHourIndex = sessionData?.currentHourIndex || 0

    // Check if already submitted for this hour
    const checkinsRef = sessionRef.collection("checkins")
    const existingCheckinQuery = await checkinsRef
      .where("hourIndex", "==", currentHourIndex)
      .where("byUid", "==", userId)
      .get()

    if (!existingCheckinQuery.empty) {
      return NextResponse.json({ error: "Check-in already submitted for this hour" }, { status: 400 })
    }

    // Create checkin
    const checkinRef = await checkinsRef.add({
      hourIndex: currentHourIndex,
      note: note.trim(),
      status: "submitted",
      submittedAt: new Date(),
      byUid: userId,
    })

    // Send notification to client
    await notifyUser({
      userId: wsData.clientUid,
      type: "workspace",
      title: "Hourly Check-in Submitted",
      message: `Talent submitted check-in for hour ${currentHourIndex + 1} in "${wsData.gigTitle || 'workspace'}"`,
      link: `/dashboard/workspaces/${wsId}`,
      emailSubject: "Hourly Check-in Submitted",
      emailHtml: `
`});

    // notify admins
    await notifyAdmins({
      type: "admin:workspace",
      title: "Check-in Submitted",
      message: `A check-in was submitted for workspace ${wsId} hour ${currentHourIndex + 1}`,
      link: `/admin/workspaces/${wsId}`,
    })
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Check-in Submitted</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #fef7ed; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(249, 115, 22, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">
                ⏰ Skills Market
              </h1>
              <p style="color: #fed7aa; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
                Check-in Submitted
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <div style="background: linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #f97316 100%); border-radius: 8px; padding: 3px; margin-bottom: 30px;">
                <div style="background: #ffffff; border-radius: 6px; padding: 25px;">
                  <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 24px; font-weight: 600;">
                    📊 Check-in Submitted
                  </h2>
                  <p style="color: #475569; margin: 0; font-size: 16px; line-height: 1.6;">
                    Your talent has submitted a check-in for <strong>hour ${currentHourIndex + 1}</strong> in <strong>"${wsData.gigTitle || 'workspace'}"</strong>.
                  </p>
                  <div style="background: #f8fafc; border-left: 4px solid #f97316; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <p style="margin: 0; color: #334155; font-style: italic; font-size: 14px;">
                      "${note.trim()}"
                    </p>
                  </div>
                </div>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://skills-market.vercel.app/dashboard/workspaces/${wsId}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4);">
                  👀 Review Check-in
                </a>
              </div>

              <div style="background: #fef3c7; border-left: 4px solid #f97316; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  💡 <strong>Action needed:</strong> Review the check-in details and approve or request changes as needed.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #1e293b; padding: 30px; text-align: center;">
              <p style="color: #94a3b8; margin: 0 0 15px 0; font-size: 14px;">
                This workspace notification was sent by Skills Market
              </p>
              <div style="border-top: 1px solid #334155; padding-top: 20px; margin-top: 20px;">
                <p style="color: #64748b; margin: 0; font-size: 12px;">
                  © 2024 Skills Market. All rights reserved.<br>
                  <a href="https://skills-market.vercel.app" style="color: #f97316; text-decoration: none;">Visit our platform</a> |
                  <a href="mailto:support@skills-market.com" style="color: #f97316; text-decoration: none;">Contact Support</a>
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
      checkinId: checkinRef.id,
      hourIndex: currentHourIndex,
    })

  } catch (error: any) {
    console.error("Error creating hourly checkin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}