import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin"
import { getSupportThreadForUser } from "@/lib/support"

export async function GET(request: NextRequest) {
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
    const role = String(userSnap.data()?.role || "")

    if (role === "admin") {
      return NextResponse.json({ error: "Admins should use the admin inbox." }, { status: 400 })
    }

    const thread = await getSupportThreadForUser(userId)
    if (!thread) {
      return NextResponse.json({ thread: null })
    }

    await db.collection("supportThreads").doc(thread.id).set({ unreadByUser: false }, { merge: true })

    return NextResponse.json({ thread })
  } catch (error: any) {
    console.error("support thread get error", error)
    return NextResponse.json({ error: error?.message || "Failed to load support thread." }, { status: 500 })
  }
}
