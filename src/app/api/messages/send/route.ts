import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebaseAdmin"
import { getFirestore } from "firebase-admin/firestore"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"

export async function POST(request: NextRequest) {
  try {
    const auth = getAdminAuth()
    const db = getAdminDb()

    // Verify authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    const { threadId, text, meta } = await request.json()

    if (!threadId || !text?.trim()) {
      return NextResponse.json({ error: "Thread ID and text are required" }, { status: 400 })
    }

    // Verify user has access to this thread
    const threadRef = db.collection("threads").doc(threadId)
    const threadSnap = await threadRef.get()

    if (!threadSnap.exists) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    const threadData = threadSnap.data()
    if (!threadData?.participants?.includes(userId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Add message to subcollection
    const messageRef = await threadRef.collection("messages").add({
      fromUid: userId,
      text: text.trim(),
      createdAt: new Date(),
      ...(meta && { meta }),
    })

    // Update thread's last message info
    await threadRef.update({
      lastMessageText: text.trim(),
      lastMessageAt: new Date(),
      lastMessageBy: userId,
      updatedAt: new Date(),
    })

    // Send notification to the other participant
    const otherParticipantId = threadData.participants.find((p: string) => p !== userId)
    if (otherParticipantId) {
      await notifyUser({
        userId: otherParticipantId,
        type: "message",
        title: "New Message",
        message: `You have a new message in "${threadData.gigTitle || 'your conversation'}"`,
        link: `/dashboard/messages/${threadId}`,
        emailSubject: `New Message from ${threadData.clientUid === userId ? threadData.clientName : threadData.talentName}`,
        emailHtml: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Message</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">
                  Skills Market
                </h1>
                <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
                  New Message Received
                </p>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 3px; margin-bottom: 30px;">
                  <div style="background: #ffffff; border-radius: 6px; padding: 25px;">
                    <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">
                      📬 New Message from ${threadData.clientUid === userId ? threadData.clientName : threadData.talentName}
                    </h2>
                    <p style="color: #475569; margin: 0 0 15px 0; font-size: 16px;">
                      You have a new message in <strong>"${threadData.gigTitle || 'your conversation'}"</strong>
                    </p>
                    <div style="background: #f8fafc; border-left: 4px solid #667eea; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 0; color: #334155; font-style: italic; font-size: 16px; line-height: 1.5;">
                        "${text.trim()}"
                      </p>
                    </div>
                  </div>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://skills-market.vercel.app/dashboard/messages/${threadId}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                    💬 View Message
                  </a>
                </div>

                <div style="background: #f1f5f9; border-left: 4px solid #667eea; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #334155; font-size: 14px;">
                    💡 <strong>Quick tip:</strong> Reply directly in your dashboard to keep the conversation flowing smoothly.
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="background: #1e293b; padding: 30px; text-align: center;">
                <p style="color: #94a3b8; margin: 0 0 15px 0; font-size: 14px;">
                  This message notification was sent by Skills Market
                </p>
                <div style="border-top: 1px solid #334155; padding-top: 20px; margin-top: 20px;">
                  <p style="color: #64748b; margin: 0; font-size: 12px;">
                    © 2024 Skills Market. All rights reserved.<br>
                    <a href="https://skills-market.vercel.app" style="color: #667eea; text-decoration: none;">Visit our platform</a> |
                    <a href="mailto:support@skills-market.com" style="color: #667eea; text-decoration: none;">Contact Support</a>
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      })
    }

    return NextResponse.json({
      success: true,
      messageId: messageRef.id,
    })

  } catch (error: any) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}