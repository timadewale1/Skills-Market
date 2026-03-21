import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebaseAdmin"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"
import { notifyAdmins } from "@/lib/notifications/notifyAdmins"
import { getThreadNotificationContext } from "@/lib/notifications/context"

export async function POST(request: NextRequest) {
  try {
    const auth = getAdminAuth()

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    await auth.verifyIdToken(token)

    const { threadId, gigTitle, talentUid } = await request.json()
    if (!threadId || !talentUid) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const context = await getThreadNotificationContext(threadId)

    await notifyUser({
      userId: talentUid,
      type: "agreement",
      title: "Agreement Sent",
      message: `${context?.clientName || "Client"} sent a hiring agreement for "${context?.gigTitle || gigTitle}". Please review and sign.`,
      link: `/dashboard/messages/${threadId}`,
      emailSubject: `Hiring Agreement for "${context?.gigTitle || gigTitle}"`,
    })

    await notifyAdmins({
      type: "admin:agreement",
      title: "Agreement drafted",
      message: `${context?.clientName || "Client"} drafted an agreement for ${context?.gigTitle || gigTitle} with ${context?.talentName || "the talent"}.`,
      link: `/admin/messages/${threadId}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error sending client signed notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
