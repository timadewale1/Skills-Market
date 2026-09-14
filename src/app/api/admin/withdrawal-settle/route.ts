import { NextRequest, NextResponse } from "next/server"
import admin from "firebase-admin"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"
import { settleWithdrawal } from "@/lib/paystack/withdrawalSettlement"

export const runtime = "nodejs"

async function requireAdmin(request: NextRequest) {
  const header = request.headers.get("authorization") || ""
  if (!header.startsWith("Bearer ")) throw new Error("Unauthorized")
  const decoded = await getAdminApp().auth().verifyIdToken(header.slice(7))
  const user = await getAdminDb().doc(`users/${decoded.uid}`).get()
  if (user.data()?.role !== "admin") throw new Error("Forbidden")
  return decoded.uid
}

export async function POST(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    const formData = await request.formData().catch(() => null)
    const payload = formData
      ? Object.fromEntries(formData.entries())
      : await request.json().catch(() => ({}))

    const uid = String(payload.uid || "")
    const withdrawalId = String(payload.withdrawalId || "")
    const action = String(payload.action || "")

    if (!uid || !withdrawalId || !["paid", "reversed"].includes(action)) {
      return NextResponse.json({ error: "Invalid withdrawal action" }, { status: 400 })
    }

    const db = getAdminDb()
    const withdrawalRef = db.doc(`wallets/${uid}`).collection("withdrawals").doc(withdrawalId)
    const withdrawalSnap = await withdrawalRef.get()
    if (!withdrawalSnap.exists) {
      return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 })
    }

    const currentStatus = String(withdrawalSnap.data()?.status || "")
    if (["paid", "failed", "reversed"].includes(currentStatus.toLowerCase())) {
      return NextResponse.json({ error: "This withdrawal is already settled" }, { status: 409 })
    }

    await settleWithdrawal(db, withdrawalRef, action as "paid" | "reversed", {
      eventName: action === "paid" ? "admin_mark_paid" : "admin_reverse",
      failureReason: action === "reversed" ? "Admin reversed pending withdrawal" : undefined,
    })

    await withdrawalRef.set(
      {
        adminAction: action,
        adminActedBy: adminUid,
        adminActionAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return NextResponse.json({ ok: true, action, uid, withdrawalId })
  } catch (error: any) {
    const status = error?.message === "Unauthorized" ? 401 : error?.message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: error?.message || "Failed to update withdrawal" }, { status })
  }
}