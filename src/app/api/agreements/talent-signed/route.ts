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

    const { threadId, gigTitle, clientUid, pdfUrl } = await request.json()
    if (!threadId || !clientUid) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const context = await getThreadNotificationContext(threadId)

    await notifyUser({
      userId: clientUid,
      type: "agreement",
      title: "Agreement Signed",
      message: `${context?.talentName || "Talent"} signed the agreement for "${context?.gigTitle || gigTitle}".${pdfUrl ? " The signed PDF is ready." : ""}`,
      link: `/dashboard/messages/${threadId}`,
      emailSubject: `Agreement Signed for "${context?.gigTitle || gigTitle}"`,
    })

    await notifyAdmins({
      type: "admin:agreement",
      title: "Agreement completed",
      message: `${context?.talentName || "Talent"} signed the agreement for ${context?.gigTitle || gigTitle} with ${context?.clientName || "the client"}.`,
      link: `/admin/messages/${threadId}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error sending talent signed notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
