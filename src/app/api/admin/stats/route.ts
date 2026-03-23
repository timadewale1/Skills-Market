import { NextRequest, NextResponse } from "next/server"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
    if (!token) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 })
    }

    const adminApp = getAdminApp()
    const decoded = await adminApp.auth().verifyIdToken(token)
    const adminDb = getAdminDb()

    const userSnap = await adminDb.collection("users").doc(decoded.uid).get()
    const userData = userSnap.data() as any
    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch actual counts from collections
    const [usersSnap, gigsSnap, workspacesSnap, disputesSnap] = await Promise.all([
      adminDb.collection("users").count().get(),
      adminDb.collection("gigs").count().get(),
      adminDb.collection("workspaces").where("status", "==", "active").count().get(),
      adminDb.collection("disputes").where("status", "==", "open").count().get(),
    ])

    const stats = {
      users: usersSnap.data().count,
      gigs: gigsSnap.data().count,
      workspaces: workspacesSnap.data().count,
      disputes: disputesSnap.data().count,
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error("Stats error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to fetch stats" },
      { status: 500 }
    )
  }
}
