import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "firebase-admin/auth"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"

export async function POST(request: NextRequest) {
  try {
    const auth = getAuth()
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
      emailHtml: `<p>Unfortunately your proposal for <strong>${gigTitle}</strong> was not selected.</p><p>You can continue to browse and apply to other gigs.</p><p><a href=\"https://skills-market.vercel.app/dashboard/proposals/${gigId}\">View Proposal</a></p>`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error sending rejection notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}