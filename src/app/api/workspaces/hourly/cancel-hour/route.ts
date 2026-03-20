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

    const { wsId } = await request.json()

    if (!wsId) {
      return NextResponse.json({ error: "wsId required" }, { status: 400 })
    }

    // Get workspace
    const wsRef = db.collection("workspaces").doc(wsId)
    const wsSnap = await wsRef.get()

    if (!wsSnap.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const wsData = wsSnap.data()
    if (wsData?.talentUid !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get current session
    const sessionRef = db.collection("workspaces").doc(wsId).collection("hourly").doc("session")
    const sessionSnap = await sessionRef.get()

    if (!sessionSnap.exists) {
      return NextResponse.json({ error: "No active session" }, { status: 400 })
    }

    const sessionData = sessionSnap.data()
    const currentHourIdx = sessionData?.currentHourIndex || 0

    // Mark this hour as cancelled in the session
    await sessionRef.update({
      cancelledHours: [...(sessionData?.cancelledHours || []), currentHourIdx],
      status: "paused",
    })

    // Notify talent
    const hourNum = currentHourIdx + 1
    const ordinalSuffix = hourNum.toString().match(/1$/) ? "st" : hourNum.toString().match(/2$/) ? "nd" : hourNum.toString().match(/3$/) ? "rd" : "th"
    
    await notifyUser({
      userId: wsData?.talentUid,
      type: "workspace",
      title: "❌ Hour Not Counted - No Check-In",
      message: `Your ${hourNum}${ordinalSuffix} hour on "${wsData?.gigTitle || "your gig"}" was not counted because no check-in was submitted within 10 minutes of completion. You did not receive pay for this hour.`,
      link: `/dashboard/workspaces/${wsId}`,
      emailSubject: `❌ Hour ${hourNum} Not Counted - No Check-In Submitted`,
      emailHtml: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #7c3aed; color: white; padding: 20px; border-radius: 8px; text-align: center; }
              .content { padding: 20px; background-color: #fafafa; }
              .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
              .button { display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
              .footer { font-size: 12px; color: #666; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>❌ Hour Not Counted</h1>
              </div>
              <div class="content">
                <p>Unfortunately, your ${hourNum}${ordinalSuffix} hour on <strong>"${wsData?.gigTitle || "your gig"}"</strong> was not counted for pay.</p>
                <div class="warning">
                  <strong>Reason:</strong> No check-in was submitted within 10 minutes of the hour completing. To ensure your hours count, please submit your check-in immediately after each hour is complete.
                </div>
                <p><strong>How to avoid this in the future:</strong></p>
                <ul>
                  <li>When your hour reaches 60 minutes, you'll receive a notification</li>
                  <li>You have 10 minutes to submit a check-in with a screenshot and work note</li>
                  <li>Submit before the countdown reaches 0:00</li>
                  <li>Your check-in must include a screenshot and at least 6 characters of text</li>
                </ul>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://changeworker.xyz"}/dashboard/workspaces/${wsId}" class="button">Go to Workspace</a>
              </div>
              <div class="footer">
                <p>If you believe this is an error, please contact support.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    // Notify client
    await notifyUser({
      userId: wsData?.clientUid,
      type: "workspace",
      title: "⏰ Hour Not Submitted",
      message: `The talent did not submit a check-in for hour ${hourNum} within the 10-minute grace period. This hour will not be counted and no payment will be made for it.`,
      link: `/dashboard/workspaces/${wsId}`,
      emailSubject: `⏰ Talent Did Not Submit Check-In for Hour ${hourNum}`,
      emailHtml: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #7c3aed; color: white; padding: 20px; border-radius: 8px; text-align: center; }
              .content { padding: 20px; background-color: #fafafa; }
              .button { display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
              .footer { font-size: 12px; color: #666; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⏰ Hour Not Submitted</h1>
              </div>
              <div class="content">
                <p>The talent on "${wsData?.gigTitle || "your gig"}" did not submit a check-in for hour ${hourNum} within the required 10-minute grace period.</p>
                <p><strong>What this means:</strong></p>
                <ul>
                  <li>Hour ${hourNum} will not be counted</li>
                  <li>No payment will be made for this hour</li>
                  <li>The talent will be notified about this</li>
                </ul>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://changeworker.xyz"}/dashboard/workspaces/${wsId}" class="button">View Workspace</a>
              </div>
              <div class="footer">
                <p>If you have questions, please contact support.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true, hourCancelled: currentHourIdx })
  } catch (error) {
    console.error("Error cancelling hour:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
