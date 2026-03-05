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

    // Notify talent
    await notifyUser({
      userId: talentUid,
      type: "proposal",
      title: "Proposal Accepted",
      message: `Your proposal for \"${gigTitle}\" has been accepted!`,
      link: `/dashboard/proposals/${gigId}`,
      emailSubject: `Your Proposal Was Accepted for \"${gigTitle}\"`,
      emailHtml: `<p>Congratulations! Your proposal for <strong>${gigTitle}</strong> has been accepted.</p><p>You can now start communicating with the client about the project details.</p><p><a href=\"https://skills-market.vercel.app/dashboard/proposals/${gigId}\">View Proposal</a></p>`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error sending acceptance notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}