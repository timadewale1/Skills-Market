import admin from "firebase-admin"
import type { Transaction } from "firebase-admin/firestore"
import { NextResponse } from "next/server"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"
import { notifyAdmins } from "@/lib/notifications/notifyAdmins"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"
import { getWorkspaceNotificationContext } from "@/lib/notifications/context"

export const runtime = "nodejs"

function setPaymentCookie(response: NextResponse, wsId: string, maxAge = 60 * 60 * 2) {
  response.cookies.set("pstk_reference", `wallet_${wsId}`, {
    path: "/",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
  })
}

function amountFromAgreement(agreement: any) {
  const base = Number(agreement?.terms?.amountAgreed || 0)
  const billingType = String(agreement?.terms?.billingType || agreement?.terms?.payType || "fixed")
  const hoursDuration = Number(agreement?.terms?.hoursDuration || 0)
  return billingType === "hourly" ? base * hoursDuration : base
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const adminApp = getAdminApp()
    const adminDb = getAdminDb()
    const decoded = await adminApp.auth().verifyIdToken(token)
    const uid = decoded.uid

    const { wsId } = await req.json()
    if (!wsId) return NextResponse.json({ error: "Workspace id required" }, { status: 400 })

    const wsRef = adminDb.doc(`workspaces/${wsId}`)
    const walletRef = adminDb.doc(`wallets/${uid}`)
    const [wsSnap, walletSnap] = await Promise.all([wsRef.get(), walletRef.get()])

    if (!wsSnap.exists) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    const ws = wsSnap.data() as any
    if (ws.clientUid !== uid) return NextResponse.json({ error: "Client only" }, { status: 403 })

    const threadId = String(ws.threadId || ws.chatThreadId || "")
    if (!threadId) return NextResponse.json({ error: "Workspace missing threadId" }, { status: 400 })

    const agreementSnap = await adminDb.doc(`threads/${threadId}/agreement/current`).get()
    if (!agreementSnap.exists) return NextResponse.json({ error: "Agreement not found" }, { status: 404 })
    const agreement = agreementSnap.data() as any

    const totalAmount = amountFromAgreement(agreement)
    if (!totalAmount || totalAmount < 100) {
      return NextResponse.json({ error: "Invalid workspace amount" }, { status: 400 })
    }

    const wallet = walletSnap.data() as any
    const availableBalance = Number(wallet?.availableBalance || 0)
    if (availableBalance < totalAmount) {
      return NextResponse.json(
        {
          error: "Insufficient wallet balance",
          required: totalAmount,
          available: availableBalance,
        },
        { status: 400 }
      )
    }

    await adminDb.runTransaction(async (tx: Transaction) => {
      const latestWalletSnap = (await tx.get(walletRef)) as any
      const latestWallet = latestWalletSnap.data() as any

      tx.set(
        wsRef,
        {
          payment: {
            status: "funded",
            fundedAt: admin.firestore.FieldValue.serverTimestamp(),
            fundedBy: "wallet_balance",
            reference: `wallet_${uid}_${wsId}`,
            amount: totalAmount,
            escrow: true,
          },
          status: "active",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      tx.set(
        wsRef.collection("payments").doc(`wallet_${uid}_${wsId}`),
        {
          reference: `wallet_${uid}_${wsId}`,
          amount: totalAmount,
          currency: "NGN",
          status: "funded",
          fundedBy: "wallet_balance",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      tx.set(wsRef.collection("escrowLedger").doc(), {
        type: "hold",
        reference: `wallet_${uid}_${wsId}`,
        amount: totalAmount,
        currency: "NGN",
        fundedBy: "wallet_balance",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      tx.set(
        walletRef,
        {
          uid,
          role: "client",
          availableBalance: Number(latestWallet?.availableBalance || 0) - totalAmount,
          totalSpent: Number(latestWallet?.totalSpent || 0) + totalAmount,
          totalWorkspaceFunded: Number((latestWallet?.totalWorkspaceFunded ?? latestWallet?.totalSpent) || 0) + totalAmount,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      tx.set(walletRef.collection("transactions").doc(`wallet_${uid}_${wsId}`), {
        type: "debit",
        reason: "workspace_funding",
        amount: totalAmount,
        currency: "NGN",
        status: "completed",
        meta: { wsId, fundingSource: "wallet_balance" },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    })

    const context = await getWorkspaceNotificationContext(wsId)
    if (uid) {
      await notifyUser({
        userId: uid,
        type: "workspace_funded",
        title: "Workspace funded",
        message: `Your wallet balance funded ${context?.gigTitle || "this workspace"}.`,
        link: `/dashboard/workspaces/${wsId}`,
      })
    }

    if (ws.talentUid) {
      await notifyUser({
        userId: ws.talentUid,
        type: "workspace_funded",
        title: "Workspace funded",
        message: `${context?.clientName || "Client"} funded ${context?.gigTitle || "your workspace"} from wallet balance.`,
        link: `/dashboard/workspaces/${wsId}`,
      })
    }

    try {
      await notifyAdmins({
        type: "admin:workspace",
        title: "Workspace funded",
        message: `${context?.clientName || "Client"} funded ${context?.gigTitle || "a workspace"} using wallet balance.`,
        link: `/admin/workspaces/${wsId}`,
      })
    } catch (error) {
      console.error("admin notify wallet funding failed", error)
    }

    const response = NextResponse.json({ ok: true, amount: totalAmount })
    setPaymentCookie(response, wsId)
    return response
  } catch (error: any) {
    console.error("[/api/wallets/fund-workspace]", error)
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 })
  }
}
