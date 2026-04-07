import { getAdminDb, getAdminApp } from "@/lib/firebaseAdmin"
import { FieldValue } from "firebase-admin/firestore"
import type { Transaction } from "firebase-admin/firestore"
import { NextResponse } from "next/server"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"
import { notifyAdmins } from "@/lib/notifications/notifyAdmins"

export const runtime = "nodejs"

function workspaceEscrowAmount(workspace: any) {
  return Number(workspace?.payment?.amount || workspace?.escrowAmount || 0)
}

function feeFromAmount(amount: number) {
  return Math.round(amount * 0.1)
}

function money(amount: number) {
  return `₦${Number(amount || 0).toLocaleString()}`
}

export async function POST(req: Request) {
  try {
    const adminDb = getAdminDb()
    const adminApp = getAdminApp()

    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const decoded = await adminApp.auth().verifyIdToken(token)
    const userId = decoded.uid

    const adminUserSnap = await adminDb.collection("users").doc(userId).get()
    if ((adminUserSnap.data() as any)?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { disputeId, action, amount, adminNotes } = await req.json()
    if (!disputeId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const disputeRef = adminDb.collection("disputes").doc(disputeId)
    const disputeSnap = await disputeRef.get()
    const dispute = disputeSnap.data() as any
    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 })
    }

    if (String(dispute.status || "").includes("resolved") || dispute.status === "closed") {
      return NextResponse.json({ error: "Dispute has already been resolved" }, { status: 400 })
    }

    const clientUid = dispute.clientUid || dispute.clientId
    const talentUid = dispute.talentUid || dispute.talentId
    const workspaceRef = adminDb.collection("workspaces").doc(dispute.workspaceId)
    const workspaceSnap = await workspaceRef.get()
    const workspace = workspaceSnap.data() as any
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const escrowAmount = workspaceEscrowAmount(workspace)
    const requestedAmount = Number(amount || 0)

    if (["release_talent", "refund_client", "partial_refund"].includes(action)) {
      if (!requestedAmount || requestedAmount <= 0 || requestedAmount > escrowAmount) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
      }
    }

    const clientWalletRef = clientUid ? adminDb.collection("wallets").doc(clientUid) : null
    const talentWalletRef = talentUid ? adminDb.collection("wallets").doc(talentUid) : null
    const payoutRevenueRef = adminDb.collection("payoutRevenue").doc()
    const escrowLedgerRef = workspaceRef.collection("escrowLedger")
    const clientRefundAmount =
      action === "refund_client" ? requestedAmount : action === "partial_refund" ? requestedAmount : 0
    const talentGrossAmount =
      action === "release_talent"
        ? requestedAmount
        : action === "partial_refund"
          ? Math.max(0, escrowAmount - requestedAmount)
          : 0
    const platformFee = talentGrossAmount > 0 ? feeFromAmount(talentGrossAmount) : 0
    const talentNetAmount = Math.max(0, talentGrossAmount - platformFee)

    await adminDb.runTransaction(async (tx: Transaction) => {
      const resolutionSummary = {
        action,
        escrowAmount,
        clientRefundAmount,
        talentGrossAmount,
        talentNetAmount,
        platformFee,
        resolvedBy: userId,
        adminNotes: String(adminNotes || ""),
        resolvedAt: FieldValue.serverTimestamp(),
      }

      if (action === "release_talent") {
        if (!talentWalletRef) throw new Error("Talent wallet not found")
        const talentWalletSnap = (await tx.get(talentWalletRef)) as any
        const talentWallet = talentWalletSnap.exists ? (talentWalletSnap.data() as any) : {}

        tx.set(
          talentWalletRef,
          {
            uid: talentUid,
            role: "talent",
            availableBalance: Number(talentWallet.availableBalance || 0) + talentNetAmount,
            totalEarned: Number(talentWallet.totalEarned || 0) + talentNetAmount,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
        tx.set(talentWalletRef.collection("transactions").doc(`dispute_${disputeId}`), {
          type: "credit",
          reason: "payout_release",
          amount: talentNetAmount,
          currency: "NGN",
          status: "completed",
          meta: { disputeId, workspaceId: dispute.workspaceId, action },
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })
        if (platformFee > 0) {
          tx.set(payoutRevenueRef, {
            disputeId,
            workspaceId: dispute.workspaceId,
            amount: platformFee,
            type: "dispute_release_fee",
            createdAt: FieldValue.serverTimestamp(),
          })
        }
        tx.set(escrowLedgerRef.doc(), {
          type: "dispute_release_talent",
          amount: requestedAmount,
          netAmount: talentNetAmount,
          feeAmount: platformFee,
          createdAt: FieldValue.serverTimestamp(),
        })
      } else if (action === "refund_client") {
        if (!clientWalletRef) throw new Error("Client wallet not found")
        const clientWalletSnap = (await tx.get(clientWalletRef)) as any
        const clientWallet = clientWalletSnap.exists ? (clientWalletSnap.data() as any) : {}

        tx.set(
          clientWalletRef,
          {
            uid: clientUid,
            role: "client",
            availableBalance: Number(clientWallet.availableBalance || 0) + clientRefundAmount,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
        tx.set(clientWalletRef.collection("transactions").doc(`dispute_${disputeId}`), {
          type: "credit",
          reason: "dispute_refund",
          amount: clientRefundAmount,
          currency: "NGN",
          status: "completed",
          meta: { disputeId, workspaceId: dispute.workspaceId, action },
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })
        tx.set(escrowLedgerRef.doc(), {
          type: "dispute_refund_client",
          amount: clientRefundAmount,
          createdAt: FieldValue.serverTimestamp(),
        })
      } else if (action === "partial_refund") {
        if (!clientWalletRef || !talentWalletRef) throw new Error("Wallet records missing")
        const [clientWalletSnap, talentWalletSnap] = (await Promise.all([
          tx.get(clientWalletRef),
          tx.get(talentWalletRef),
        ])) as any[]
        const clientWallet = clientWalletSnap.exists ? (clientWalletSnap.data() as any) : {}
        const talentWallet = talentWalletSnap.exists ? (talentWalletSnap.data() as any) : {}

        tx.set(
          clientWalletRef,
          {
            uid: clientUid,
            role: "client",
            availableBalance: Number(clientWallet.availableBalance || 0) + clientRefundAmount,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
        tx.set(
          talentWalletRef,
          {
            uid: talentUid,
            role: "talent",
            availableBalance: Number(talentWallet.availableBalance || 0) + talentNetAmount,
            totalEarned: Number(talentWallet.totalEarned || 0) + talentNetAmount,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
        tx.set(clientWalletRef.collection("transactions").doc(`dispute_client_${disputeId}`), {
          type: "credit",
          reason: "dispute_refund",
          amount: clientRefundAmount,
          currency: "NGN",
          status: "completed",
          meta: { disputeId, workspaceId: dispute.workspaceId, action },
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })
        tx.set(talentWalletRef.collection("transactions").doc(`dispute_talent_${disputeId}`), {
          type: "credit",
          reason: "payout_release",
          amount: talentNetAmount,
          currency: "NGN",
          status: "completed",
          meta: { disputeId, workspaceId: dispute.workspaceId, action },
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })
        if (platformFee > 0) {
          tx.set(payoutRevenueRef, {
            disputeId,
            workspaceId: dispute.workspaceId,
            amount: platformFee,
            type: "dispute_partial_fee",
            createdAt: FieldValue.serverTimestamp(),
          })
        }
        tx.set(escrowLedgerRef.doc(), {
          type: "dispute_partial_settlement",
          refundAmount: clientRefundAmount,
          talentGrossAmount,
          talentNetAmount,
          feeAmount: platformFee,
          createdAt: FieldValue.serverTimestamp(),
        })
      } else if (action === "close_case") {
        tx.set(escrowLedgerRef.doc(), {
          type: "dispute_closed",
          amount: 0,
          createdAt: FieldValue.serverTimestamp(),
        })
      } else {
        throw new Error("Invalid action")
      }

      tx.update(disputeRef, {
        status: action === "close_case" ? "closed" : `resolved_${action}`,
        stage: "resolved",
        resolvedAt: FieldValue.serverTimestamp(),
        resolution: action,
        adminNotes: String(adminNotes || ""),
        resolutionSummary,
        resolutionHistory: FieldValue.arrayUnion({
          action,
          clientRefundAmount,
          talentGrossAmount,
          talentNetAmount,
          platformFee,
          resolvedBy: userId,
          adminNotes: String(adminNotes || ""),
          at: new Date().toISOString(),
        }),
      })

      tx.set(
        workspaceRef,
        {
          disputeStatus: "resolved",
          updatedAt: FieldValue.serverTimestamp(),
          payment: {
            ...(workspace.payment || {}),
            escrow: action === "close_case" ? workspace?.payment?.escrow !== false : false,
            disputeResolution: {
              action,
              clientRefundAmount,
              talentGrossAmount,
              talentNetAmount,
              platformFee,
            },
          },
        },
        { merge: true }
      )
    })

    const disputeLink = `/dashboard/disputes/${disputeId}`
    if (clientUid) {
      await notifyUser({
        userId: clientUid,
        type: "admin_decision",
        title: "Dispute resolved",
        message:
          action === "refund_client" || action === "partial_refund"
            ? `Admin resolved the dispute. Client refund: ${money(clientRefundAmount)}.`
            : "Admin resolved the dispute. Review the case outcome in your dashboard.",
        link: disputeLink,
      })
    }
    if (talentUid) {
      await notifyUser({
        userId: talentUid,
        type: "admin_decision",
        title: "Dispute resolved",
        message:
          talentNetAmount > 0
            ? `Admin resolved the dispute. Talent release: ${money(talentNetAmount)} after platform fee.`
            : "Admin resolved the dispute. Review the case outcome in your dashboard.",
        link: disputeLink,
      })
    }

    try {
      await notifyAdmins({
        type: "admin:dispute",
        title: "Dispute resolved",
        message: `Dispute ${disputeId.slice(-8)} was resolved with action ${action.replace(/_/g, " ")}.`,
        link: `/admin/disputes/${disputeId}`,
      })
    } catch (error) {
      console.error("Admin dispute notify failed", error)
    }

    return NextResponse.json({
      success: true,
      outcome: {
        action,
        clientRefundAmount,
        talentGrossAmount,
        talentNetAmount,
        platformFee,
      },
    })
  } catch (error: any) {
    console.error("Resolve dispute error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
