import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebaseAdmin"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"

export async function POST(request: NextRequest) {
  try {
    const auth = getAdminAuth()
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    await auth.verifyIdToken(token)

    const { userId: targetUserId, role } = await request.json()
    if (!targetUserId || !role) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 })
    }

    await notifyUser({
      userId: targetUserId,
      type: "verification",
      title: "Verification Approved",
      message: `Your ${role === "talent" ? "personal" : "organization"} verification has been approved.`,
      link: `/dashboard/profile`,
      emailSubject: "Your Verification Has Been Approved",
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("kyc-approved notify error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
