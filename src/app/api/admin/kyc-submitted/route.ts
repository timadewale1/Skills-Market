import { NextRequest, NextResponse } from "next/server"
import admin from "firebase-admin"
import type { Transaction } from "firebase-admin/firestore"
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin"
import { notifyAdmins } from "@/lib/notifications/notifyAdmins"

export async function POST(request: NextRequest) {
  try {
    const auth = getAdminAuth()
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    const decoded = await auth.verifyIdToken(token)
    const userId = decoded.uid

    const db = getAdminDb()
    const userRef = db.collection("users").doc(userId)
    const userSnap = await userRef.get()
    const user = userSnap.data() as any
    const role = String(user?.role || "")
    const verification = role === "client" ? user?.orgKyc : user?.kyc

    if (!userSnap.exists || !["talent", "client"].includes(role)) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    if (user?.profileComplete !== true || verification?.status !== "pending") {
      return NextResponse.json({ success: true, notified: false, reason: "Profile or verification is not ready" })
    }

    const shouldNotify = await db.runTransaction(async (transaction: Transaction) => {
      const currentSnap = (await transaction.get(userRef)) as any
      const current = currentSnap.data() as any
      if (current?.adminVerificationAlertStatus === "pending") return false
      transaction.update(userRef, {
        adminVerificationAlertStatus: "pending",
        adminVerificationAlertAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      return true
    })

    if (!shouldNotify) return NextResponse.json({ success: true, notified: false, reason: "Already notified" })

    const fullName = String(user?.fullName || user?.client?.orgName || user?.email || userId)
    const detailPath = role === "client" ? `/control/clients/${userId}` : `/control/talents/${userId}`
    await notifyAdmins({
      type: "admin:verification",
      title: "Profile awaiting verification",
      message: `${fullName} (${role}) has completed their profile and is awaiting verification.`,
      link: detailPath,
      meta: { userId, role },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("kyc-submitted notify error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
