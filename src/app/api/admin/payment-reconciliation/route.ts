import { NextRequest, NextResponse } from "next/server"
import admin from "firebase-admin"
import type { Transaction } from "firebase-admin/firestore"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"

export const runtime = "nodejs"

async function requireAdmin(request: NextRequest) {
  const header = request.headers.get("authorization") || ""
  if (!header.startsWith("Bearer ")) throw new Error("Unauthorized")
  const decoded = await getAdminApp().auth().verifyIdToken(header.slice(7))
  const user = await getAdminDb().doc(`users/${decoded.uid}`).get()
  if (user.data()?.role !== "admin") throw new Error("Forbidden")
  return decoded.uid
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request)
    const snap = await getAdminDb().collection("paymentReconciliationCases").get()
    const cases = snap.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => Number(b.updatedAt?.toMillis?.() || 0) - Number(a.updatedAt?.toMillis?.() || 0))
    return NextResponse.json({ cases })
  } catch (error: any) {
    const status = error?.message === "Unauthorized" ? 401 : error?.message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: error?.message || "Failed to load reconciliation cases" }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUid = await requireAdmin(request)
    const { caseId, note } = await request.json()
    if (!caseId) return NextResponse.json({ error: "caseId is required" }, { status: 400 })

    const db = getAdminDb()
    const caseRef = db.collection("paymentReconciliationCases").doc(String(caseId))
    const caseSnap = await caseRef.get()
    if (!caseSnap.exists) return NextResponse.json({ error: "Reconciliation case not found" }, { status: 404 })
    const paymentCase = caseSnap.data() as any
    if (!["needs_manual_review", "retrying"].includes(String(paymentCase.status))) {
      return NextResponse.json({ error: "This case is already resolved or not ready for manual resolution" }, { status: 409 })
    }

    const reference = String(paymentCase.reference || "")
    const amount = Number(paymentCase.amount || 0)
    if (!reference) return NextResponse.json({ error: "Case has no payment reference" }, { status: 400 })

    if (paymentCase.kind === "wallet_topup") {
      const uid = String(paymentCase.ownerId || "")
      const walletRef = db.doc(`wallets/${uid}`)
      const topupRef = walletRef.collection("topups").doc(reference)
      const txRef = walletRef.collection("transactions").doc(reference)
      await db.runTransaction(async (tx: Transaction) => {
        const [walletSnap, topupSnap, walletTxSnap] = (await Promise.all([
          tx.get(walletRef),
          tx.get(topupRef),
          tx.get(txRef),
        ])) as any[]
        if (!topupSnap.exists || !walletTxSnap.exists) throw new Error("Pending wallet records not found")
        const topup = topupSnap.data() as any
        if (topup.status === "funded") return
        const expected = Number(topup.amount || walletTxSnap.data()?.amount || amount)
        if (!expected) throw new Error("Payment amount is missing")
        const wallet = walletSnap.exists ? walletSnap.data() as any : {}
        tx.set(walletRef, { uid, availableBalance: Number(wallet.availableBalance || 0) + expected, totalLoaded: Number(wallet.totalLoaded || 0) + expected, totalFundingReceived: Number(wallet.totalFundingReceived || 0) + expected, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
        tx.set(txRef, { status: "completed", meta: { reference, confirmedBy: "admin_manual_reconciliation", adminUid }, completedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
        tx.set(topupRef, { status: "funded", amount: expected, confirmedBy: "admin_manual_reconciliation", paidAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
      })
    } else {
      const workspaceId = String(paymentCase.workspaceId || paymentCase.ownerId || "")
      const wsRef = db.doc(`workspaces/${workspaceId}`)
      const paymentRef = wsRef.collection("payments").doc(reference)
      await db.runTransaction(async (tx: Transaction) => {
        const [wsSnap, paymentSnap] = (await Promise.all([
          tx.get(wsRef),
          tx.get(paymentRef),
        ])) as any[]
        if (!wsSnap.exists || !paymentSnap.exists) throw new Error("Pending workspace payment not found")
        const payment = paymentSnap.data() as any
        if (payment.status === "funded") return
        const expected = Number(payment.amount || amount)
        if (!expected) throw new Error("Payment amount is missing")
        tx.set(paymentRef, { status: "funded", fundedBy: "admin_manual_reconciliation", paidAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
        tx.set(wsRef, { payment: { status: "funded", fundedBy: "admin_manual_reconciliation", fundedAt: admin.firestore.FieldValue.serverTimestamp(), reference, amount: expected, escrow: true }, status: "active", updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
        tx.set(wsRef.collection("escrowLedger").doc(), { type: "hold", reference, amount: expected, currency: "NGN", fundedBy: "admin_manual_reconciliation", createdAt: admin.firestore.FieldValue.serverTimestamp() })
      })
    }

    await caseRef.set({ status: "resolved", resolvedBy: adminUid, resolutionNote: String(note || "Manual reconciliation confirmed by admin"), resolvedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    const status = error?.message === "Unauthorized" ? 401 : error?.message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: error?.message || "Failed to resolve reconciliation case" }, { status })
  }
}
