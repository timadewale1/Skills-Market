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

    const { threadId, gigTitle, talentUid } = await request.json()

    if (!threadId || !talentUid) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Notify talent that client sent agreement
    await notifyUser({
      userId: talentUid,
      type: "agreement",
      title: "Agreement Sent",
      message: `Client sent a hiring agreement for "${gigTitle}". Please review and sign.`,
      link: `/dashboard/messages/${threadId}`,
      emailSubject: `Hiring Agreement for "${gigTitle}"`,
      emailHtml: `<p>A hiring agreement has been sent for <strong>${gigTitle}</strong>.</p><p>Please review the terms and sign to proceed.</p><p><a href="https://skills-market.vercel.app/dashboard/messages/${threadId}">Review Agreement</a></p>`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error sending client signed notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}