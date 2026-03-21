import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"

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

    const { threadId, text, meta } = await request.json()
    if (!threadId || !text?.trim()) {
      return NextResponse.json({ error: "Thread ID and text are required" }, { status: 400 })
    }

    const threadRef = db.collection("threads").doc(threadId)
    const threadSnap = await threadRef.get()

    if (!threadSnap.exists) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    const threadData = threadSnap.data()
    if (!threadData?.participants?.includes(userId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const messageRef = await threadRef.collection("messages").add({
      fromUid: userId,
      text: text.trim(),
      createdAt: new Date(),
      ...(meta && { meta }),
    })

    await threadRef.update({
      lastMessageText: text.trim(),
      lastMessageAt: new Date(),
      lastMessageBy: userId,
      updatedAt: new Date(),
    })

    const otherParticipantId = threadData.participants.find((p: string) => p !== userId)
    if (otherParticipantId) {
      const senderName = threadData.clientUid === userId ? threadData.clientName : threadData.talentName
      await notifyUser({
        userId: otherParticipantId,
        type: "message",
        title: "New Message",
        message: `You have a new message from ${senderName || "your collaborator"} in "${threadData.gigTitle || "your conversation"}".`,
        link: `/dashboard/messages/${threadId}`,
        emailSubject: `New Message from ${senderName || "your collaborator"}`,
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
