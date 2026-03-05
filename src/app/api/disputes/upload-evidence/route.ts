import { getAdminDb, getAdminStorage, getAdminAuth } from "@/lib/firebaseAdmin"
import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"

export async function POST(req: Request) {
  try {
    const adminDb = getAdminDb()
    const adminStorage = getAdminStorage()
    const auth = getAdminAuth()

    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const decoded = await auth.verifyIdToken(token)
    const userId = decoded.uid

    const form = await req.formData()

    const disputeId = form.get("disputeId") as string
    const file = form.get("file") as File
    const uploadedBy = form.get("uploadedBy") as string
    const description = form.get("description") as string || ""

    if (!disputeId || !file || !uploadedBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate user is part of the dispute
    const disputeRef = adminDb.collection("disputes").doc(disputeId)
    const dispute = (await disputeRef.get()).data()

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 })
    }

    if (dispute.clientId !== userId && dispute.talentId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'application/x-zip-compressed',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const path = `disputes/${disputeId}/evidence/${Date.now()}-${file.name}`

    const bucket = adminStorage.bucket()
    const fileRef = bucket.file(path)

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    })

    const url = `https://storage.googleapis.com/${bucket.name}/${path}`

    await adminDb.collection("disputeEvidence").add({
      disputeId,
      uploadedBy,
      fileUrl: url,
      fileType: file.type,
      description,
      createdAt: FieldValue.serverTimestamp()
    })

    await adminDb.collection("disputes")
      .doc(disputeId)
      .update({
        evidenceCount: FieldValue.increment(1)
      })

    // Notify the other party
    const otherUserId = dispute.clientId === userId ? dispute.talentId : dispute.clientId
    await notifyUser({
      userId: otherUserId,
      type: "evidence_uploaded",
      title: "Evidence uploaded",
      message: "New evidence has been uploaded to your dispute",
      link: `/dashboard/disputes/${disputeId}`
    })

    return NextResponse.json({ url, success: true })
  } catch (error: any) {
    console.error("Upload evidence error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}