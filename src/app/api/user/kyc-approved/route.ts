import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"

export async function POST(request: NextRequest) {
  try {
    const auth = getAdminAuth()
    const db = getAdminDb()
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    const decoded = await auth.verifyIdToken(token)
    const userId = decoded.uid

    const { userId: targetUserId, role, approvalType } = await request.json()
    if (!targetUserId || !role) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 })
    }

    // Fetch user email for notification
    const userSnap = await db.collection("users").doc(targetUserId).get()
    const userData = userSnap.data() as any
    const userEmail = userData?.email || ""
    const fullName = userData?.fullName || "User"

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Approved</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #fef7ed; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(249, 115, 22, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">
              ✅ Skills Market
            </h1>
            <p style="color: #fed7aa; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
              Verification Approved!
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="background: linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #f97316 100%); border-radius: 8px; padding: 3px; margin-bottom: 30px;">
              <div style="background: #ffffff; border-radius: 6px; padding: 25px;">
                <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 24px; font-weight: 600;">
                  🎉 Verification Approved
                </h2>
                <p style="color: #475569; margin: 0; font-size: 16px; line-height: 1.6;">
                  Congratulations, <strong>${fullName}</strong>! Your ${role === "talent" ? "personal" : "organization"} verification has been approved.
                </p>
                <p style="color: #475569; margin: 15px 0 0 0; font-size: 16px; line-height: 1.6;">
                  You can now fully access all features and post ${role === "talent" ? "proposals" : "high-value gigs"} on the platform.
                </p>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://skills-market.vercel.app/dashboard/profile" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4);">
                📊 View Your Profile
              </a>
            </div>

            <div style="background: #fef3c7; border-left: 4px solid #f97316; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                🚀 <strong>Next Steps:</strong> Start ${role === "talent" ? "applying to gigs" : "posting opportunities"} and grow your business on Skills Market!
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #1e293b; padding: 30px; text-align: center;">
            <p style="color: #94a3b8; margin: 0 0 15px 0; font-size: 14px;">
              This notification was sent by Skills Market
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
    `

    await notifyUser({
      userId: targetUserId,
      type: "verification",
      title: "Verification Approved",
      message: `Congratulations! Your ${role === "talent" ? "personal" : "organization"} verification has been approved.`,
      link: `/dashboard/profile`,
      emailSubject: "Your Verification Has Been Approved",
      emailHtml,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("kyc-approved notify error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
