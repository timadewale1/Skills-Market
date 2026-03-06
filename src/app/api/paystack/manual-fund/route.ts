import { NextResponse } from "next/server"
import { getAdminDb, getAdminApp } from "@/lib/firebaseAdmin"
import admin from "firebase-admin"
import type { Transaction } from "firebase-admin/firestore"

export async function POST(req: Request) {
  try {
    const { wsId, reference } = await req.json()

    if (!wsId) return NextResponse.json({ error: "wsId required" }, { status: 400 })

    const adminDb = getAdminDb()
    const wsRef = adminDb.doc(`workspaces/${wsId}`)

    // Get workspace data
    const wsSnap = await wsRef.get()
    if (!wsSnap.exists) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })

    const ws = wsSnap.data() as any
    const paymentStatus = ws?.payment?.status

    if (paymentStatus === "funded") {
      return NextResponse.json({ message: "Workspace already funded" })
    }

    // Find the payment document
    let paymentDoc = null
    let paymentRef = null

    if (reference) {
      paymentRef = wsRef.collection("payments").doc(reference)
      const paymentSnap = await paymentRef.get()
      if (paymentSnap.exists) {
        paymentDoc = paymentSnap.data()
      }
    } else {
      // Find the most recent initiated payment
      const paymentsQuery = wsRef.collection("payments").where("status", "==", "initiated").orderBy("createdAt", "desc").limit(1)
      const paymentsSnap = await paymentsQuery.get()
      if (!paymentsSnap.empty) {
        const paymentDocSnap = paymentsSnap.docs[0]
        paymentRef = paymentDocSnap.ref
        paymentDoc = paymentDocSnap.data()
      }
    }

    if (!paymentDoc) {
      return NextResponse.json({ error: "No payment document found" }, { status: 404 })
    }

    const amount = paymentDoc.amount || 0

    // Update workspace to funded
    await adminDb.runTransaction(async (tx: Transaction) => {
      tx.set(
        wsRef,
        {
          payment: {
            status: "funded",
            fundedAt: admin.firestore.FieldValue.serverTimestamp(),
            fundedBy: "manual_funding",
            reference: reference || paymentDoc.reference,
            amount: amount,
            escrow: true,
          },
          status: "active",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      if (paymentRef) {
        tx.set(
          paymentRef,
          {
            status: "funded",
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
      }

      // Write escrow ledger entry
      const escrowLedgerRef = adminDb.collection(`workspaces/${wsId}/escrowLedger`).doc()
      tx.set(escrowLedgerRef, {
        type: "hold",
        reference: reference || paymentDoc.reference,
        amount: amount,
        currency: "NGN",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    })

    return NextResponse.json({
      message: "Workspace marked as funded",
      wsId,
      amount,
      reference: reference || paymentDoc.reference
    })

  } catch (e: any) {
    console.error("[Manual Funding] Error:", e)
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}