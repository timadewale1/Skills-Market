"use client"

import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import { auth } from "@/lib/firebase"

export default function DeleteReviewButton({
  reviewId,
  kind,
}: {
  reviewId: string
  kind: "peer" | "platform"
}) {
  const router = useRouter()

  const onDelete = async () => {
    if (!confirm("Delete this review? This cannot be undone.")) return
    try {
      const token = await auth.currentUser?.getIdToken()
      const response = await fetch("/api/admin/reviews/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reviewId, kind }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to delete review")
      toast.success("Review deleted")
      router.push("/admin/reviews")
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete review")
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
    >
      <Trash2 size={14} />
      Delete review
    </button>
  )
}
