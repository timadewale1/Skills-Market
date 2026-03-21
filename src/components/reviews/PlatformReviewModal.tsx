"use client"

import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import toast from "react-hot-toast"
import StarRating from "./StarRating"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Button from "@/components/ui/Button"
import { X } from "lucide-react"

export default function PlatformReviewModal({
  workspaceId,
  open,
  onOpenChange,
}: {
  workspaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  // Platform rating
  const [rating, setRating] = useState(5)

  // Platform-specific ratings
  const [easeOfUse, setEaseOfUse] = useState(5)
  const [support, setSupport] = useState(5)
  const [value, setValue] = useState(5)

  // Comments
  const [comment, setComment] = useState("")
  const [isPublic, setIsPublic] = useState(true)

  async function submit() {
    if (!user?.uid) {
      toast.error("Not authenticated")
      return
    }

    if (!user?.displayName) {
      toast.error("Please set your name in your profile")
      return
    }

    if (!comment.trim()) {
      toast.error("Please share your thoughts about Changeworker")
      return
    }

    setLoading(true)
    try {
      const token = await user.getIdToken()

      const response = await fetch("/api/reviews/platform", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId,
          rating,
          easeOfUseRating: easeOfUse,
          supportRating: support,
          valueRating: value,
          comment: comment.trim(),
          isPublic,
          userName: user.displayName,
          userProfileImage: user.photoURL || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to submit platform review")
        return
      }

      toast.success("Thank you for rating Changeworker!")
      onOpenChange(false)

      // Reset form
      setRating(5)
      setEaseOfUse(5)
      setSupport(5)
      setValue(5)
      setComment("")
      setIsPublic(true)
    } catch (err: any) {
      console.error("Platform review submission error:", err)
      toast.error(err?.message || "Failed to submit platform review")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <DialogTitle className="text-xl font-extrabold">Rate Changeworker</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Overall Rating */}
          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Overall Experience</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {/* Ease of Use */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Ease of Use</Label>
            <StarRating value={easeOfUse} onChange={setEaseOfUse} size={20} />
          </div>

          {/* Support */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Support & Help</Label>
            <StarRating value={support} onChange={setSupport} size={20} />
          </div>

          {/* Value */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Value for Money</Label>
            <StarRating value={value} onChange={setValue} size={20} />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label className="text-sm font-extrabold">Share your thoughts about Changeworker</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like? What could be improved?"
              className="min-h-[80px] rounded-xl"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {comment.length}/500
            </div>
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="platform-public"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="platform-public" className="text-sm">
              Make this review public (will be shown on our homepage)
            </Label>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-2xl border bg-white font-extrabold py-2"
          >
            Skip for now
          </button>
          <Button
            onClick={submit}
            disabled={loading}
            className="flex-1 rounded-2xl bg-[var(--primary)] text-white font-extrabold py-2"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}