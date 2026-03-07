import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebaseAdmin"
import { getAdminDb } from "@/lib/firebaseAdmin"

export async function POST(request: NextRequest) {
  try {
    const auth = getAdminAuth()
    const db = getAdminDb()

    // Verify authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    const {
      workspaceId,
      rating,
      easeOfUseRating,
      supportRating,
      valueRating,
      comment,
      isPublic,
    } = await request.json()

    if (!workspaceId || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify workspace exists and user participated
    const wsRef = db.collection("workspaces").doc(workspaceId)
    const wsSnap = await wsRef.get()

    if (!wsSnap.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const wsData = wsSnap.data()
    if (wsData?.clientUid !== userId && wsData?.talentUid !== userId) {
      return NextResponse.json({ error: "Access denied - only workspace participants can review platform" }, { status: 403 })
    }

    // Check if user already submitted platform review for this workspace
    const existingQuery = await db
      .collection("platform_reviews")
      .where("workspaceId", "==", workspaceId)
      .where("fromUserId", "==", userId)
      .get()

    if (!existingQuery.empty) {
      return NextResponse.json({ error: "You have already reviewed the platform for this workspace" }, { status: 400 })
    }

    // Create platform review
    const reviewRef = await db.collection("platform_reviews").add({
      workspaceId,
      fromUserId: userId,
      fromRole: wsData?.clientUid === userId ? "client" : "talent",
      rating: Number(rating),
      easeOfUseRating: Number(easeOfUseRating),
      supportRating: Number(supportRating),
      valueRating: Number(valueRating),
      comment: comment.trim(),
      isPublic: Boolean(isPublic),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      reviewId: reviewRef.id,
    })
  } catch (error: any) {
    console.error("Error creating platform review:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}