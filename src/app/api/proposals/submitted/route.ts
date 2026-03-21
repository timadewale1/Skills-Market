import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"
import { notifyAdmins } from "@/lib/notifications/notifyAdmins"
import { getGigNotificationContext } from "@/lib/notifications/context"

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

    const { gigId, gigTitle, clientUid, talentEmail } = await request.json()
    if (!gigId || !clientUid || !talentEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [context, talentSnap] = await Promise.all([
      getGigNotificationContext(gigId),
      db.collection("users").doc(userId).get(),
    ])

    const talentName =
      talentSnap.data()?.fullName ||
      talentSnap.data()?.name ||
      talentEmail ||
      "A talent"

    await notifyUser({
      userId: clientUid,
      type: "proposal",
      title: "New Proposal Received",
      message: `${talentName} submitted a proposal for "${context?.gigTitle || gigTitle}"`,
      link: `/dashboard/gigs/${gigId}/proposals`,
      emailSubject: `New Proposal for ${context?.gigTitle || gigTitle}`,
    })

    await notifyAdmins({
      type: "admin:proposal",
      title: "New proposal submitted",
      message: `${talentName} submitted a proposal for ${context?.gigTitle || gigTitle} for ${context?.clientName || "the client"}.`,
      link: `/admin/gigs/${gigId}/proposals`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error sending proposal notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
