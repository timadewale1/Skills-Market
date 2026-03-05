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

    const { threadId, gigTitle, clientUid, pdfUrl } = await request.json()

    if (!threadId || !clientUid) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Notify client that talent signed
    const emailHtml = pdfUrl
      ? `<p>The talent has signed the agreement for <strong>${gigTitle}</strong>.</p><p>The fully signed agreement PDF is ready.</p><p><a href="${pdfUrl}">Download Agreement PDF</a></p><p><a href="https://skills-market.vercel.app/dashboard/messages/${threadId}">View Chat</a></p>`
      : `<p>The talent has signed the agreement for <strong>${gigTitle}</strong>.</p><p><a href="https://skills-market.vercel.app/dashboard/messages/${threadId}">View Chat</a></p>`

    await notifyUser({
      userId: clientUid,
      type: "agreement",
      title: "Agreement Signed",
      message: `Talent signed the agreement for "${gigTitle}".${pdfUrl ? " PDF is ready." : ""}`,
      link: `/dashboard/messages/${threadId}`,
      emailSubject: `Agreement Signed for "${gigTitle}"`,
      emailHtml,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error sending talent signed notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}