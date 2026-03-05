import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "firebase-admin/auth"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"

export async function POST(request: NextRequest) {
  try {
    const auth = getAuth()
    const db = getAdminDb()

    // Verify authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    const { gigId, gigTitle, clientUid, talentEmail } = await request.json()

    if (!gigId || !clientUid || !talentEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Send notification to client
    await notifyUser({
      userId: clientUid,
      type: "proposal",
      title: "New Proposal Received",
      message: `${talentEmail} submitted a proposal for "${gigTitle}"`,
      link: `/dashboard/gigs/${gigId}/proposals`,
      emailSubject: `New Proposal for ${gigTitle}`,
      emailHtml: `<p>A talent has submitted a proposal for your gig <strong>${gigTitle}</strong>.</p><p><a href="https://skills-market.vercel.app/dashboard/gigs/${gigId}/proposals">Review Proposals</a></p>`,
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Error sending proposal notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}