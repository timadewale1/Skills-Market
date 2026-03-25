import { NextRequest, NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin"
import { notifyAdmins } from "@/lib/notifications/notifyAdmins"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"
import { ensureSupportThread, getSupportThreadForUser } from "@/lib/support"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const auth = getAdminAuth()
    const db = getAdminDb()
    const decoded = await auth.verifyIdToken(authHeader.slice(7))
    const userId = decoded.uid

    const userSnap = await db.collection("users").doc(userId).get()
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User record not found." }, { status: 404 })
    }

    const userData = userSnap.data() as any
    const role = String(userData?.role || "")
    const body = await request.json()
    const text = String(body?.text || "").trim()
    const threadIdFromRequest = typeof body?.threadId === "string" ? body.threadId.trim() : ""

    if (!text) {
      return NextResponse.json({ error: "Message text is required." }, { status: 400 })
    }

    if (role === "admin") {
      if (!threadIdFromRequest) {
        return NextResponse.json({ error: "Support thread ID is required." }, { status: 400 })
      }

      const threadRef = db.collection("supportThreads").doc(threadIdFromRequest)
      const threadSnap = await threadRef.get()
      if (!threadSnap.exists) {
        return NextResponse.json({ error: "Support thread not found." }, { status: 404 })
      }

      const thread = threadSnap.data() as any
      await threadRef.collection("messages").add({
        senderUid: userId,
        senderRole: "admin",
        senderName: userData?.fullName || userData?.email || "Admin support",
        text,
        createdAt: FieldValue.serverTimestamp(),
      })
      await threadRef.set(
        {
          lastMessageText: text,
          lastMessageAt: FieldValue.serverTimestamp(),
          lastMessageBy: userId,
          unreadByUser: true,
          unreadByAdmin: false,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      await notifyUser({
        userId: thread.createdByUid,
        type: "support_reply",
        title: "Support replied to your question",
        message: `Admin support replied to your dashboard help request.`,
        link: "/dashboard",
        emailSubject: "Support replied to your changeworker question",
      })

      return NextResponse.json({ success: true, threadId: threadRef.id })
    }

    if (role !== "talent" && role !== "client") {
      return NextResponse.json({ error: "Only dashboard users can open support chats." }, { status: 403 })
    }

    const threadId = await ensureSupportThread({
      userUid: userId,
      userRole: role,
      userName:
        userData?.client?.orgName ||
        userData?.fullName ||
        userData?.email ||
        (role === "talent" ? "Talent" : "Client"),
      userEmail: userData?.email || decoded.email || null,
    })

    const threadRef = db.collection("supportThreads").doc(threadId)
    await threadRef.collection("messages").add({
      senderUid: userId,
      senderRole: role,
      senderName:
        userData?.client?.orgName ||
        userData?.fullName ||
        userData?.email ||
        (role === "talent" ? "Talent" : "Client"),
      text,
      createdAt: FieldValue.serverTimestamp(),
    })
    await threadRef.set(
      {
        status: "open",
        lastMessageText: text,
        lastMessageAt: FieldValue.serverTimestamp(),
        lastMessageBy: userId,
        unreadByAdmin: true,
        unreadByUser: false,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    await notifyAdmins({
      type: "support_request",
      title: "New dashboard support request",
      message: `${userData?.client?.orgName || userData?.fullName || "A user"} sent a support message from the ${role} dashboard.`,
      link: `/admin/support/${threadId}`,
      emailSubject: "New changeworker dashboard support request",
      meta: {
        supportThreadId: threadId,
        role,
      },
    })

    const thread = await getSupportThreadForUser(userId)
    return NextResponse.json({ success: true, threadId, thread })
  } catch (error: any) {
    console.error("support send error", error)
    return NextResponse.json({ error: error?.message || "Failed to send support message." }, { status: 500 })
  }
}
