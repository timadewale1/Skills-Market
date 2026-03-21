import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebaseAdmin"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"
import { notifyAdmins } from "@/lib/notifications/notifyAdmins"

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
      title: "Proposal Rejected",
      message: `Your proposal for "${gigTitle}" was not selected.`,
      link: `/dashboard/proposals/${gigId}`,
      emailSubject: `Proposal Rejected for "${gigTitle}"`,
    })

    await notifyAdmins({
      type: "admin:proposal",
      title: "Proposal Rejected",
      message: `A client rejected a proposal for ${gigTitle}.`,
      link: `/admin/gigs/${gigId}/proposals`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error sending rejection notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
