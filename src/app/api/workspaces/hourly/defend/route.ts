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

    const { wsId, checkinId, note } = await request.json()

    if (!wsId || !checkinId || !note?.trim()) {
      return NextResponse.json({ error: "Workspace ID, checkin ID, and note are required" }, { status: 400 })
    }

    // Verify workspace exists and user is talent
    const wsRef = db.collection("workspaces").doc(wsId)
    const wsSnap = await wsRef.get()

    if (!wsSnap.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const wsData = wsSnap.data()
    if (wsData?.talentUid !== userId) {
      return NextResponse.json({ error: "Access denied - only talent can defend checkins" }, { status: 403 })
    }

    // Get checkin
    const checkinRef = wsRef.collection("hourly").doc("session").collection("checkins").doc(checkinId)
    const checkinSnap = await checkinRef.get()

    if (!checkinSnap.exists) {
      return NextResponse.json({ error: "Check-in not found" }, { status: 404 })
    }

    const checkinData = checkinSnap.data()
    if (checkinData?.status !== "disputed") {
      return NextResponse.json({ error: "Check-in is not disputed" }, { status: 400 })
    }

    // Update checkin with defense
    await checkinRef.update({
      defense: {
        note: note.trim(),
        at: new Date(),
        byUid: userId,
      },
      updatedAt: new Date(),
    })

    // Send notification to client
    await notifyUser({
      userId: wsData.clientUid,
      type: "workspace",
      title: "Hourly Check-in Defended",
      message: `Talent defended their disputed check-in for hour ${checkinData.hourIndex + 1} in "${wsData.gigTitle || 'workspace'}"`,
      link: `/dashboard/workspaces/${wsId}`,
      emailSubject: "Talent Submitted Defense for Disputed Check-in",
      emailHtml: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Defense Submitted</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #fef7ed; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(249, 115, 22, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">
                🛡️ Skills Market
              </h1>
              <p style="color: #fed7aa; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
                Defense Submitted
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <div style="background: linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #f97316 100%); border-radius: 8px; padding: 3px; margin-bottom: 30px;">
                <div style="background: #ffffff; border-radius: 6px; padding: 25px;">
                  <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 24px; font-weight: 600;">
                    🛡️ Defense Submitted
                  </h2>
                  <p style="color: #475569; margin: 0; font-size: 16px; line-height: 1.6;">
                    Your talent has submitted a defense for their disputed check-in for <strong>hour ${checkinData.hourIndex + 1}</strong>.
                  </p>
                  <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <p style="margin: 0; color: #0c4a6e; font-weight: 600; font-size: 14px;">
                      Defense: ${note.trim()}
                    </p>
                  </div>
                  <p style="color: #475569; margin: 15px 0 0 0; font-size: 16px; line-height: 1.6;">
                    You can review the defense and decide how to proceed with this dispute.
                  </p>
                </div>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://skills-market.vercel.app/dashboard/workspaces/${wsId}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4);">
                  🔍 Review Defense
                </a>
              </div>

              <div style="background: #fef3c7; border-left: 4px solid #f97316; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  💡 <strong>Resolution options:</strong> You can accept the defense, request more information, or escalate to platform support if needed.
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
    })

  } catch (error: any) {
    console.error("Error defending checkin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}