import { NextResponse } from "next/server"
import crypto from "crypto"
import { getAdminDb, getAdminApp } from "@/lib/firebaseAdmin"
import admin from "firebase-admin"
import type { Transaction } from "firebase-admin/firestore"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"
import { notifyAdmins } from "@/lib/notifications/notifyAdmins"
import { getWorkspaceNotificationContext } from "@/lib/notifications/context"

export const runtime = "nodejs"

async function readRawBody(req: Request) {
  const arrayBuffer = await req.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY
  if (!secret) return NextResponse.json({ error: "Missing PAYSTACK secret" }, { status: 500 })

  const signature = req.headers.get("x-paystack-signature") || ""
  const raw = await readRawBody(req)

  const hash = crypto.createHmac("sha512", secret).update(raw).digest("hex")
  if (hash !== signature) {
    console.error("[Paystack Webhook] Signature mismatch")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const event = JSON.parse(raw.toString("utf8"))
  console.log("[Paystack Webhook] Event received:", event.event, "Reference:", event?.data?.reference)
  console.log("[Paystack Webhook] Full event data:", JSON.stringify(event, null, 2))

  try {
    const adminDb = getAdminDb()
    const adminApp = getAdminApp()
    const db = adminDb

    // We only handle charge.success for funding
    if (event?.event !== "charge.success") {
      console.log("[Paystack Webhook] Ignoring event type:", event?.event)
      return NextResponse.json({ ok: true })
    }

    const reference = String(event?.data?.reference || "")
    const metadata = event?.data?.metadata || {}
    const wsId = String(metadata?.wsId || "")

    console.log("[Paystack Webhook] charge.success - wsId:", wsId, "reference:", reference)

    if (!reference || !wsId) {
      console.warn("[Paystack Webhook] Missing reference or wsId")
      return NextResponse.json({ ok: true })
    }

    // Verify with Paystack to be safe
    const verifyResp = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    })
    
    const verifyText = await verifyResp.text()
    let verifyJson
    try {
      verifyJson = JSON.parse(verifyText)
    } catch (e) {
      console.error("[Paystack Verify Webhook] JSON parse failed:", e, "Text:", verifyText.substring(0, 200))
      return NextResponse.json({ ok: true })
    }
    
    if (!verifyResp.ok || !verifyJson?.status || verifyJson?.data?.status !== "success") {
      return NextResponse.json({ ok: true })
    }

    const paidKobo = Number(verifyJson.data.amount || 0)
    const paidNaira = paidKobo / 100

    // Idempotency: if already funded, skip
    const payRef = db.doc(`workspaces/${wsId}/payments/${reference}`)
    const paySnap = await payRef.get()
    if (paySnap.exists && (paySnap.data() as any)?.status === "funded") {
      console.log("[Paystack Webhook] Payment already funded, skipping")
      return NextResponse.json({ ok: true })
    }

    console.log("[Paystack Webhook] Updating payment and workspace status...")

    // Update payment doc + workspace escrow status (store Paystack event id for audit)
    const wsRef = db.doc(`workspaces/${wsId}`)
    await db.runTransaction(async (tx: Transaction) => {
      const eventId = String(event?.id || "")

      tx.set(
        payRef,
        {
          reference,
          amount: paidNaira,
          currency: "NGN",
          status: "funded",
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          paystackEventId: eventId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      tx.set(
        wsRef,
        {
          payment: {
            status: "funded",
            fundedAt: admin.firestore.FieldValue.serverTimestamp(),
            fundedBy: "paystack_webhook",
            reference,
            amount: paidNaira,
            escrow: true,
          },
          status: "active",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      // Write escrow ledger entry for funding
      const escrowLedgerRef = db.collection(`workspaces/${wsId}/escrowLedger`).doc()
      tx.set(escrowLedgerRef, {
        type: "hold",
        reference,
        amount: paidNaira,
        currency: "NGN",
        paystackEventId: eventId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    })

    console.log("[Paystack Webhook] Payment and workspace updated successfully")

    // Notify client and talent that workspace is funded
    const wsSnap = await wsRef.get()
    const ws = wsSnap.data() as any
    const clientUid = ws?.clientUid
    const talentUid = ws?.talentUid

    const context = await getWorkspaceNotificationContext(wsId)

    if (clientUid) {
      await notifyUser({
        userId: clientUid,
        type: "workspace_funded",
        title: "Workspace funded",
        message: `Your payment for ${context?.gigTitle || "this workspace"} has been confirmed and work can now begin.`,
        link: `/dashboard/workspaces/${wsId}`,
      })
    }

    if (talentUid) {
      await notifyUser({
        userId: talentUid,
        type: "workspace_funded",
        title: "Workspace funded",
        message: `${context?.clientName || "Client"} funded ${context?.gigTitle || "your workspace"} and you can now start work.`,
        link: `/dashboard/workspaces/${wsId}`,
      })
    }

    // notify admins as well
    try {
      await notifyAdmins({
        type: "admin:workspace",
        title: "Workspace funded",
        message: `${context?.clientName || "Client"} funded ${context?.gigTitle || "a workspace"} with ${context?.talentName || "the talent"}.`,
        link: `/admin/workspaces/${wsId}`,
      })
    } catch (err) {
      console.error("admin notify workspace funded failed", err)
    }

    // Client spend tally (wallet)
    const walletRef = db.doc(`wallets/${clientUid}`)
    if (clientUid) {
      await db.runTransaction(async (tx: Transaction) => {
        const wSnap = (await tx.get(walletRef)) as any
        const existing = wSnap?.exists ? (wSnap.data() as any) : {}
        tx.set(
          walletRef,
          {
            uid: clientUid,
            role: "client",
            totalSpent: Number(existing.totalSpent || 0) + paidNaira,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: existing.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
        tx.set(walletRef.collection("transactions").doc(reference), {
          type: "debit",
          reason: "workspace_funding",
          amount: paidNaira,
          currency: "NGN",
          status: "completed",
          meta: { wsId, reference },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[paystack webhook] error", e)
    return NextResponse.json({ ok: true })
  }
}
