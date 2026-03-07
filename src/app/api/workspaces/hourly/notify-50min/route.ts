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

    const { wsId, hourIndex } = await request.json()

    if (!wsId || hourIndex === undefined) {
      return NextResponse.json({ error: "wsId and hourIndex required" }, { status: 400 })
    }

    // Verify workspace exists and user is talent
    const wsRef = db.collection("workspaces").doc(wsId)
    const wsSnap = await wsRef.get()

    if (!wsSnap.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const wsData = wsSnap.data()
    if (wsData?.talentUid !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Send notification to talent
    const hourNum = (hourIndex || 0) + 1
    await notifyUser({
      userId: userId,
      type: "workspace",
      title: "⏰ Hour Check-In Reminder",
      message: `Your ${hourNum.toString().match(/1$/) ? "st" : hourNum.toString().match(/2$/) ? "nd" : hourNum.toString().match(/3$/) ? "rd" : "th"} hour on "${wsData?.gigTitle || "your gig"}" is almost complete (50 mins elapsed). Don't forget to submit your check-in before the hour ends!`,
      link: `/dashboard/workspaces/${wsId}`,
      emailSubject: `⏰ Time to Check In - Hour ${hourNum} Almost Complete`,
      emailHtml: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Hour Check-In Reminder</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #fef7ed; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(249, 115, 22, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">
                ⏰ Check-In Time Alert
              </h1>
              <p style="color: #fed7aa; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
                Your Hour ${hourNum} is almost complete
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%); border-radius: 8px; padding: 3px; margin-bottom: 30px;">
                <div style="background: #ffffff; border-radius: 6px; padding: 25px;">
                  <h2 style="color: #92400e; margin: 0 0 15px 0; font-size: 22px; font-weight: 600;">
                    50 Minutes Elapsed ⏱️
                  </h2>
                  <p style="color: #b45309; margin: 0; font-size: 16px; line-height: 1.6;">
                    You're working on <strong>"${wsData?.gigTitle || "your gig"}"</strong> and your ${hourNum.toString().match(/1$/) ? "1st" : hourNum.toString().match(/2$/) ? "2nd" : hourNum.toString().match(/3$/) ? "3rd" : hourNum + "th"} hour is almost up!
                  </p>
                </div>
              </div>

              <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #1e40af; font-weight: 600; font-size: 16px; line-height: 1.6;">
                  📝 Remember to submit your check-in with:
                </p>
                <ul style="color: #1e40af; font-size: 14px; margin: 10px 0 0 20px; padding: 0;">
                  <li>📸 Screenshot proof of your work</li>
                  <li>📝 Brief note about what you worked on</li>
                </ul>
              </div>

              <p style="color: #92400e; margin: 20px 0 0 0; font-size: 15px; line-height: 1.6;">
                <strong>Important:</strong> If you don't submit a check-in before the hour completes, that hour won't count for pay. Visit your workspace now to submit your evidence!
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://changeworker.vercel.app/dashboard/workspaces/${wsId}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4); transition: all 0.3s ease;">
                  Go to Workspace
                </a>
              </div>

              <!-- Pro tip -->
              <div style="background: #f3f4f6; border-left: 4px solid #6b7280; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #374151; font-size: 13px;">
                  💡 <strong>Pro tip:</strong> Set a reminder 5 minutes before each hour to ensure you don't miss your check-in window!
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #1e293b; padding: 30px; text-align: center;">
              <p style="color: #94a3b8; margin: 0 0 15px 0; font-size: 14px;">
                This hourly check-in reminder was sent by Changeworker
              </p>
              <div style="border-top: 1px solid #334155; padding-top: 20px; margin-top: 20px;">
                <p style="color: #64748b; margin: 0; font-size: 12px;">
                  © 2024 Changeworker. All rights reserved.<br>
                  <a href="https://changeworker.vercel.app" style="color: #f97316; text-decoration: none;">Visit Platform</a> |
                  <a href="mailto:support@changeworker.com" style="color: #f97316; text-decoration: none;">Contact Support</a>
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error sending 50-min notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
