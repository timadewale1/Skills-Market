import { NextResponse } from "next/server"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"
import { notifyAdmins } from "@/lib/notifications/notifyAdmins"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const adminApp = getAdminApp()
    const decoded = await adminApp.auth().verifyIdToken(token)
    const db = getAdminDb()

    const adminUser = (await db.collection("users").doc(decoded.uid).get()).data() as any
    if (adminUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { gigId } = await req.json()
    if (!gigId) return NextResponse.json({ error: "gigId is required" }, { status: 400 })

    const gigRef = db.collection("gigs").doc(gigId)
    const gigSnap = await gigRef.get()
    if (!gigSnap.exists) return NextResponse.json({ error: "Gig not found" }, { status: 404 })

    const gig = gigSnap.data() as any
    const proposalsSnap = await gigRef.collection("proposals").get()

    const batch = db.batch()
    proposalsSnap.docs.forEach((proposalDoc: any) => batch.delete(proposalDoc.ref))
    batch.delete(gigRef)
    await batch.commit()

    if (gig.clientUid) {
      await notifyUser({
        userId: gig.clientUid,
        type: "admin_decision",
        title: "Gig removed by admin",
        message: `Your gig "${gig.title || "Untitled gig"}" was removed from the marketplace by admin review.`,
        link: "/dashboard/gigs",
      })
    }

    try {
      await notifyAdmins({
        type: "admin:gig",
        title: "Gig deleted",
        message: `Gig "${gig.title || gigId}" was deleted from admin operations.`,
        link: "/admin/gigs",
      })
    } catch (error) {
      console.error("Admin gig delete notify failed", error)
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Admin gig delete failed", error)
    return NextResponse.json({ error: error?.message || "Failed to delete gig" }, { status: 500 })
  }
}
