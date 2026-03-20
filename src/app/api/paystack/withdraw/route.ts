import { NextResponse } from "next/server"
import crypto from "crypto"
import { getAdminDb, getAdminApp } from "@/lib/firebaseAdmin"
import admin from "firebase-admin"
import type { Transaction } from "firebase-admin/firestore"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"
import { notifyAdmins } from "@/lib/notifications/notifyAdmins"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const adminDb = getAdminDb()
    const adminApp = getAdminApp()
    const { amount } = await req.json()
    const amountNaira = Number(amount || 0)

    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const decoded = await adminApp.auth().verifyIdToken(token)
    const uid = decoded.uid

    if (!amountNaira || amountNaira < 1000) {
      return NextResponse.json({ error: "Minimum withdrawal is ₦1,000" }, { status: 400 })
    }

    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.json({ error: "Missing PAYSTACK_SECRET_KEY" }, { status: 500 })

    const db = adminDb
    const walletRef = db.doc(`wallets/${uid}`)

    const withdrawalId = `wd_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`

    await db.runTransaction(async (tx: Transaction) => {
      const wSnap = (await tx.get(walletRef)) as any
      if (!wSnap?.exists) throw new Error("Wallet not found")
      const w = wSnap.data() as any
      if (w.role !== "talent") throw new Error("Talent only")
      if (!w.bank?.recipientCode) throw new Error("Add & verify bank account first")

      const avail = Number(w.availableBalance || 0)
      if (amountNaira > avail) throw new Error("Insufficient balance")

      // move to pending
      tx.update(walletRef, {
        availableBalance: avail - amountNaira,
        pendingBalance: Number(w.pendingBalance || 0) + amountNaira,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      tx.set(walletRef.collection("withdrawals").doc(withdrawalId), {
        amount: amountNaira,
        status: "requested",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      tx.set(walletRef.collection("transactions").doc(withdrawalId), {
        type: "debit",
        reason: "withdrawal",
        amount: amountNaira,
        currency: "NGN",
        status: "pending",
        meta: { withdrawalId },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    })

    // initiate Paystack transfer
    const wSnap2 = await walletRef.get()
    const w2 = wSnap2.data() as any

    const transferResp = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "balance",
        amount: Math.round(amountNaira * 100),
        recipient: w2.bank.recipientCode,
        reason: "changeworker withdrawal",
        reference: withdrawalId,
      }),
    })

    const transferJson = await transferResp.json()

    if (!transferResp.ok || !transferJson?.status) {
      // rollback pending -> available
      await db.runTransaction(async (tx: Transaction) => {
        const wSnap = (await tx.get(walletRef)) as any
        const w = wSnap.data() as any
        tx.update(walletRef, {
          availableBalance: Number(w.availableBalance || 0) + amountNaira,
          pendingBalance: Math.max(0, Number(w.pendingBalance || 0) - amountNaira),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
        tx.update(walletRef.collection("withdrawals").doc(withdrawalId), {
          status: "failed",
          error: transferJson,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
        tx.update(walletRef.collection("transactions").doc(withdrawalId), { status: "failed" })
      })

      return NextResponse.json({ error: "Transfer failed", details: transferJson }, { status: 400 })
    }

    await walletRef.collection("withdrawals").doc(withdrawalId).set(
      {
        status: "processing",
        paystack: {
          transferCode: transferJson.data.transfer_code,
          reference: withdrawalId,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    // Send notification for withdrawal request
    await notifyUser({
      userId: uid,
      type: "withdrawal",
      title: "Withdrawal requested",
      message: `Your withdrawal of ₦${amountNaira.toLocaleString()} has been submitted and is being processed`,
      link: `/dashboard/wallet`,
    })

    // also notify admins
    try {
      await notifyAdmins({
        type: "admin:withdrawal",
        title: "Withdrawal requested",
        message: `Talent ${uid} requested ₦${amountNaira.toLocaleString()}`,
        link: `/admin/wallets`,
      })
    } catch (err) {
      console.error("admin notify withdrawal failed", err)
    }

    return NextResponse.json({ ok: true, withdrawalId })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}
