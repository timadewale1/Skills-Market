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

    const { gigId, gigTitle, talentUid } = await request.json()
    if (!gigId || !talentUid) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await notifyUser({
      userId: talentUid,
      type: "proposal",
      title: "Proposal Accepted",
      message: `Your proposal for "${gigTitle}" has been accepted.`,
      link: `/dashboard/proposals/${gigId}`,
      emailSubject: `Your Proposal Was Accepted for "${gigTitle}"`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error sending acceptance notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
