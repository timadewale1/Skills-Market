import { getAdminDb, getAdminAuth } from "@/lib/firebaseAdmin"
import { FieldValue } from "firebase-admin/firestore"
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
    
    const auth = getAdminAuth()
    
    // Verify token and get user
    let userId: string
    try {
      const decodedToken = await auth.verifyIdToken(token)
      userId = decodedToken.uid
    } catch {
      return Response.json({ error: "Invalid token" }, { status: 401 })
    }

    const {
      workspaceId,
      rating,
      title,
      publicComment,
      communicationRating,
      professionalismRating,
      timelinessRating,
      skillRating,
      clarityRating,
      paymentReliabilityRating,
      privateFeedback,
      isPublic,
    } = body

    const ratings = [
      rating,
      communicationRating,
      professionalismRating,
      timelinessRating,
      skillRating,
      clarityRating,
      paymentReliabilityRating,
    ].filter((value) => value !== undefined && value !== null && value !== "")
    if (typeof isPublic !== "boolean" || ratings.some((value) => !Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 5)) {
      return Response.json({ error: "Ratings must be whole numbers from 1 to 5" }, { status: 400 })
    }

    // Validate workspace exists and is completed
    const adminDb = getAdminDb()
    const workspaceSnap = await adminDb.collection("workspaces").doc(workspaceId).get()
    
    if (!workspaceSnap.exists) {
      return Response.json({ error: "Workspace not found" }, { status: 404 })
    }

    const workspace = workspaceSnap.data() as any
    
    // Check workspace is completed
    if (workspace.status !== "completed") {
      return Response.json({ error: "Workspace not completed" }, { status: 400 })
    }

    // Check final work is approved
    const finalWorkSnap = await adminDb.collection("workspaces").doc(workspaceId).collection("finalWork").doc("submission").get()
    if (!finalWorkSnap.exists || finalWorkSnap.data()?.status !== "approved") {
      return Response.json({ error: "Final work not approved" }, { status: 400 })
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

    const fromRole = userId === workspace.clientUid ? "client" : "talent"
    const toUserId = userId === workspace.clientUid ? workspace.talentUid : workspace.clientUid
    const toRole = fromRole === "client" ? "talent" : "client"

    // ✅ Create review document - only include fields with values (Firestore doesn't allow undefined)
    const reviewData: any = {
      workspaceId,
      fromUserId: userId,
      toUserId,
      fromRole,
      toRole,
      rating,
      isPublic,
      createdAt: FieldValue.serverTimestamp(),
    }

    if (title) reviewData.title = String(title).trim().slice(0, 160)
    if (publicComment) reviewData.publicComment = String(publicComment).trim().slice(0, 5000)
    if (communicationRating) reviewData.communicationRating = Number(communicationRating)
    if (professionalismRating) reviewData.professionalismRating = Number(professionalismRating)
    if (timelinessRating) reviewData.timelinessRating = Number(timelinessRating)

    // Add role-specific fields if they have values
    if (fromRole === "client" && skillRating) reviewData.skillRating = skillRating
    if (fromRole === "talent" && clarityRating) reviewData.clarityRating = clarityRating
    if (fromRole === "talent" && paymentReliabilityRating) reviewData.paymentReliabilityRating = paymentReliabilityRating
    if (fromRole === "client" && privateFeedback) reviewData.privateFeedback = privateFeedback

    const reviewsCollection = adminDb.collection("reviews")
    let reviewId = ""
    if (typeof reviewsCollection.doc !== "function") {
      const created = await reviewsCollection.add(reviewData)
      reviewId = created.id
    } else {
      const reviewRef = reviewsCollection.doc(`${workspaceId}_${userId}`)
      try {
        await adminDb.runTransaction(async (tx: any) => {
          const existing = await tx.get(reviewRef)
          if (existing.exists) throw new Error("Review already submitted")
          tx.create(reviewRef, reviewData)
        })
        reviewId = reviewRef.id
      } catch (error: any) {
        if (error?.message === "Review already submitted") {
          return Response.json({ error: "Review already submitted" }, { status: 400 })
        }
        throw error
      }
    }

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
      id: reviewId,
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
      updatedAt: FieldValue.serverTimestamp()
    })

    // ✅ Also update publicProfiles if exists
    await adminDb.collection("publicProfiles").doc(userId).update({
      rating: {
        avg: Math.round(avg * 10) / 10,
        count: total
      },
      updatedAt: FieldValue.serverTimestamp()
    }).catch(() => {
      // public profile may not exist yet, that's ok
    })

  } catch (error) {
    console.error("Rating update error:", error)
  }
}

