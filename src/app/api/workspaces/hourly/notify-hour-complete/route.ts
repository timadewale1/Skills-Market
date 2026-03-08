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
    const ordinalSuffix = hourNum.toString().match(/1$/) ? "st" : hourNum.toString().match(/2$/) ? "nd" : hourNum.toString().match(/3$/) ? "rd" : "th"
    
    await notifyUser({
      userId: userId,
      type: "workspace",
      title: "⏰ Hour Complete - Submit Check-In Now",
      message: `Your ${hourNum}${ordinalSuffix} hour on "${wsData?.gigTitle || "your gig"}" is complete! You have 10 minutes to submit a check-in. If you don't submit within 10 minutes, this hour won't count for pay.`,
      link: `/dashboard/workspaces/${wsId}`,
      emailSubject: `⏰ Hour ${hourNum} Complete - Submit Check-In in 10 Minutes`,
      emailHtml: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 8px; text-align: center; }
              .content { padding: 20px; background-color: #fafafa; }
              .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
              .footer { font-size: 12px; color: #666; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⏰ Hour ${hourNum} Complete!</h1>
              </div>
              <div class="content">
                <p>Your ${hourNum}${ordinalSuffix} hour on <strong>"${wsData?.gigTitle || "your gig"}"</strong> has reached 60 minutes and is now complete.</p>
                <p><strong style="color: #dc2626;">IMPORTANT:</strong> You have <strong>10 minutes</strong> to submit a check-in with a screenshot and work note. If you don't submit within 10 minutes, this hour won't count for pay.</p>
                <p>Please go to your workspace immediately and submit your check-in:</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://skillsmarket.xyz"}/dashboard/workspaces/${wsId}" class="button">Submit Check-In Now</a>
                <p><strong>What you need to do:</strong></p>
                <ul>
                  <li>Take a screenshot of your work</li>
                  <li>Add a brief note about what you accomplished</li>
                  <li>Submit before the 10-minute countdown ends</li>
                </ul>
                <p>The client will review your check-in and approve or dispute it.</p>
              </div>
              <div class="footer">
                <p>If you have questions, please contact support.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending hour-complete notification:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
