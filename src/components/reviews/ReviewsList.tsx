"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

type Review = {
  id: string
  fromUserId: string
  fromRole: "client" | "talent"
  rating: number
  title: string
  publicComment: string
  createdAt?: any
}

interface ReviewsListProps {
  userId: string
  /**
   * Custom message to display when there are no public reviews. If omitted,
   * we fall back to the original encouragement text which makes sense on
   * public profiles.
   */
  emptyMessage?: string
}

export default function ReviewsList({ userId, emptyMessage }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [avgRating, setAvgRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true)
      try {
        const q = query(
          collection(db, "reviews"),
          where("toUserId", "==", userId),
          where("isPublic", "==", true)
        )
        const snap = await getDocs(q)

        const reviewList = snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        })) as Review[]

        // Sort by newest first
        reviewList.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0
          const bTime = b.createdAt?.toMillis?.() || 0
          return bTime - aTime
        })

        setReviews(reviewList)
        setTotalReviews(reviewList.length)

        if (reviewList.length > 0) {
          const sum = reviewList.reduce((acc, r) => acc + (r.rating || 0), 0)
          setAvgRating(Math.round((sum / reviewList.length) * 10) / 10)
        } else {
          setAvgRating(0)
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [userId])

  if (loading) {
    return (
      <div className="text-sm text-gray-600">Loading reviews...</div>
    )
  }

  if (totalReviews === 0) {
    return (
      <div className="text-sm text-gray-600">
        {emptyMessage || "No reviews yet. Complete your first project to receive feedback!"}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Rating Summary */}
      <div className="flex items-center gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-extrabold">
              {avgRating.toFixed(1)}
            </span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={18}
                  className={
                    i <= Math.round(avgRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {totalReviews} review{totalReviews !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.slice(0, 5).map((review) => (
          <Card key={review.id} className="rounded-2xl">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-extrabold text-gray-900">{review.title}</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i <= review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {review.fromRole === "client" ? "Client" : "Talent"}
                </span>
              </div>

              {/* Comment */}
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                {review.publicComment}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalReviews > 5 && (
        <p className="text-xs text-gray-600 text-center mt-4">
          +{totalReviews - 5} more review{totalReviews - 5 !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  )
}
