import { getAdminDb } from "@/lib/firebaseAdmin"
import * as admin from "firebase-admin"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // ✅ Get current user from Firebase Auth header
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.slice(7)
    
    // Verify token and get user
    let userId: string
    try {
      const decodedToken = await admin.auth().verifyIdToken(token)
      userId = decodedToken.uid
    } catch {
      return Response.json({ error: "Invalid token" }, { status: 401 })
    }

    const { workspaceId, rating, title, publicComment, communicationRating, professionalismRating, timelinessRating, skillRating, clarityRating, paymentReliabilityRating, privateFeedback, isPublic, fromRole } = body

    // Validate workspace exists and is completed
    const adminDb = getAdminDb()
    const workspaceSnap = await adminDb.collection("workspaces").doc(workspaceId).get()
    
    if (!workspaceSnap.exists) {
      return Response.json({ error: "Workspace not found" }, { status: 404 })
    }

    const workspace = workspaceSnap.data() as any
    
    if (workspace.status !== "completed" || workspace.finalWorkApproved !== true) {
      return Response.json({ error: "Workspace not completed or work not approved" }, { status: 400 })
    }

    const isParticipant = workspace.clientUid === userId || workspace.talentUid === userId
    if (!isParticipant) {
      return Response.json({ error: "Not allowed" }, { status: 403 })
    }

    // ✅ Check if review already exists
    const existingReviewSnap = await adminDb
      .collection("reviews")
      .where("workspaceId", "==", workspaceId)
      .where("fromUserId", "==", userId)
      .get()
    
    if (!existingReviewSnap.empty) {
      return Response.json({ error: "Review already submitted" }, { status: 400 })
    }

    const toUserId = userId === workspace.clientUid ? workspace.talentUid : workspace.clientUid
    const toRole = fromRole === "client" ? "talent" : "client"

    // ✅ Create review document
    const reviewRef = await adminDb.collection("reviews").add({
      workspaceId,
      fromUserId: userId,
      toUserId,
      fromRole,
      toRole,
      rating,
      title,
      publicComment,
      communicationRating,
      professionalismRating,
      timelinessRating,
      skillRating: fromRole === "client" ? skillRating : undefined,
      clarityRating: fromRole === "talent" ? clarityRating : undefined,
      paymentReliabilityRating: fromRole === "talent" ? paymentReliabilityRating : undefined,
      privateFeedback: fromRole === "client" ? privateFeedback : undefined,
      isPublic,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    // Notify the reviewed user
    await notifyUser({
      userId: toUserId,
      type: "review",
      title: "You received a new review",
      message: `${fromRole === "client" ? "Client" : "Talent"} left you a ${rating}-star review`,
      link: `/dashboard/profile`,
    })

    // ✅ Update user rating aggregates
    await updateUserRating(toUserId)

    return Response.json({ 
      id: reviewRef.id,
      message: "Review submitted successfully" 
    })
  } catch (error: any) {
    console.error("Review submission error:", error)
    return Response.json({ error: error?.message || "Server error" }, { status: 500 })
  }
}

async function updateUserRating(userId: string) {
  try {
    const adminDb = getAdminDb()
    const reviewsSnap = await adminDb
      .collection("reviews")
      .where("toUserId", "==", userId)
      .where("isPublic", "==", true)
      .get()
    
    const reviews = reviewsSnap.docs.map((d: any) => d.data() as any)
    
    const total = reviews.length
    const sum = reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0)
    const avg = total > 0 ? sum / total : 0

    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    reviews.forEach((r: any) => {
      const rating = Math.round(r.rating || 0)
      if (rating >= 1 && rating <= 5) {
        breakdown[rating] = (breakdown[rating] || 0) + 1
      }
    })

    // ✅ Update user document with rating metadata
    await adminDb.collection("users").doc(userId).update({
      rating: {
        avg: Math.round(avg * 10) / 10,
        count: total
      },
      ratingBreakdown: breakdown,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })

    // ✅ Also update publicProfiles if exists
    await adminDb.collection("publicProfiles").doc(userId).update({
      rating: {
        avg: Math.round(avg * 10) / 10,
        count: total
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }).catch(() => {
      // public profile may not exist yet, that's ok
    })

  } catch (error) {
    console.error("Rating update error:", error)
  }
}

