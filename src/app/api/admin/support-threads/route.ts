import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const auth = getAdminAuth()
    const db = getAdminDb()
    const decoded = await auth.verifyIdToken(authHeader.slice(7))
    const userSnap = await db.collection("users").doc(decoded.uid).get()
    if (userSnap.data()?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const snap = await db.collection("supportThreads").orderBy("updatedAt", "desc").limit(8).get()
    const threads = snap.docs.map((threadDoc: any) => ({ id: threadDoc.id, ...(threadDoc.data() as any) }))
    return NextResponse.json({ threads })
  } catch (error: any) {
    console.error("admin support threads error", error)
    return NextResponse.json({ error: error?.message || "Failed to load support threads." }, { status: 500 })
  }
}
