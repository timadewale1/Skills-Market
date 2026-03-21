import { NextResponse } from "next/server"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminApp = getAdminApp()
    const token = authHeader.slice(7)
    const decoded = await adminApp.auth().verifyIdToken(token)
    const { reviewId, kind } = await req.json()
    if (!reviewId) {
      return NextResponse.json({ error: "Missing reviewId" }, { status: 400 })
    }
    const db = getAdminDb()
    const adminUser = await db.collection("users").doc(decoded.uid).get()
    if (adminUser.data()?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const collectionName = kind === "platform" ? "platform_reviews" : "reviews"
    await db.collection(collectionName).doc(reviewId).delete()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 })
  }
}
