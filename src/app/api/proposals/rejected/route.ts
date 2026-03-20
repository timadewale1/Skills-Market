import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebaseAdmin"
import { getAdminDb } from "@/lib/firebaseAdmin"
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

    const { gigId, gigTitle, talentUid } = await request.json()

    if (!gigId || !talentUid) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Notify talent of rejection
    await notifyUser({
      userId: talentUid,
      type: "proposal",
      title: "Proposal Rejected",
      message: `Your proposal for \"${gigTitle}\" was not selected.`,
      link: `/dashboard/proposals/${gigId}`,
      emailSubject: `Proposal Rejected for \"${gigTitle}\"`,
      emailHtml: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Proposal Rejected</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #fef7ed; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(249, 115, 22, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">
                changeworker
              </h1>
              <p style="color: #fed7aa; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
                Proposal Update
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <div style="background: linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #f97316 100%); border-radius: 8px; padding: 3px; margin-bottom: 30px;">
                <div style="background: #ffffff; border-radius: 6px; padding: 25px;">
                  <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 24px; font-weight: 600;">
                    📝 Proposal Update
                  </h2>
                  <p style="color: #475569; margin: 0; font-size: 16px; line-height: 1.6;">
                    Unfortunately, your proposal for <strong>"${gigTitle}"</strong> was not selected for this project.
                  </p>
                  <p style="color: #475569; margin: 15px 0 0 0; font-size: 16px; line-height: 1.6;">
                    Don't be discouraged! You can continue to browse and apply to other exciting gigs on our platform.
                  </p>
                </div>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://changeworker.vercel.app/dashboard/proposals/${gigId}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4);">
                  📄 View Proposal
                </a>
              </div>

              <div style="background: #fef3c7; border-left: 4px solid #f97316; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  💡 <strong>Keep going:</strong> Every great opportunity starts with persistence. Check out new gigs and keep building your portfolio!
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #1e293b; padding: 30px; text-align: center;">
              <p style="color: #94a3b8; margin: 0 0 15px 0; font-size: 14px;">
                This notification was sent by changeworker
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

    // notify admins too
    await notifyAdmins({
      type: "admin:proposal",
      title: "Proposal Rejected",
      message: `Client rejected a proposal for \"${gigTitle}\" (gig ${gigId}).`,
      link: `/admin/gigs/${gigId}/proposals`,
    });

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error sending rejection notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
