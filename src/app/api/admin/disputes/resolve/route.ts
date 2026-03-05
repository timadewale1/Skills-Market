import { getAdminDb, getAdminApp } from "@/lib/firebaseAdmin"
import { FieldValue } from "firebase-admin/firestore"
import { NextResponse } from "next/server"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"

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

    // TODO: Add admin role check here
    // For now, assume the user is admin if they can access this endpoint

    const { disputeId, action, amount, adminNotes } = await req.json()

    if (!disputeId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const disputeRef = adminDb.collection("disputes").doc(disputeId)
    const dispute = (await disputeRef.get()).data()

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 })
    }

    // Get workspace to check escrow amount
    const workspaceRef = adminDb.collection("workspaces").doc(dispute.workspaceId)
    const workspace = (await workspaceRef.get()).data()

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const escrowAmount = workspace.escrowAmount || 0

    if (action === "release_talent") {
      if (!amount || amount > escrowAmount) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
      }

      await adminDb.collection("wallets")
        .doc(dispute.talentId)
        .update({
          balance: FieldValue.increment(amount)
        })

    } else if (action === "refund_client") {
      if (!amount || amount > escrowAmount) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
      }

      await adminDb.collection("wallets")
        .doc(dispute.clientId)
        .update({
          balance: FieldValue.increment(amount)
        })

    } else if (action === "partial_refund") {
      if (!amount || amount > escrowAmount) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
      }

      const talentAmount = escrowAmount - amount
      const clientAmount = amount

      await adminDb.collection("wallets")
        .doc(dispute.talentId)
        .update({
          balance: FieldValue.increment(talentAmount)
        })

      await adminDb.collection("wallets")
        .doc(dispute.clientId)
        .update({
          balance: FieldValue.increment(clientAmount)
        })

    } else if (action === "close_case") {
      // No payment changes for close case
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    await disputeRef.update({
      status: `resolved_${action}`,
      stage: "resolved",
      resolvedAt: FieldValue.serverTimestamp(),
      resolution: action,
      adminNotes: adminNotes || ""
    })

    await adminDb.collection("workspaces")
      .doc(dispute.workspaceId)
      .update({
        disputeStatus: "resolved"
      })

    // Notify both parties
    await notifyUser({
      userId: dispute.clientId,
      type: "admin_decision",
      title: "Dispute resolved",
      message: "An admin has resolved your dispute",
      link: `/dashboard/disputes/${disputeId}`
    })

    await notifyUser({
      userId: dispute.talentId,
      type: "admin_decision",
      title: "Dispute resolved",
      message: "An admin has resolved your dispute",
      link: `/dashboard/disputes/${disputeId}`
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Resolve dispute error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}