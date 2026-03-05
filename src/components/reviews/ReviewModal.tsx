"use client"

import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import toast from "react-hot-toast"
import StarRating from "./StarRating"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Button from "@/components/ui/Button"
import { X } from "lucide-react"

export default function ReviewModal({
  workspaceId,
  role, // "client" or "talent"
  open,
  onOpenChange,
}: {
  workspaceId: string
  role: "client" | "talent"
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  // Main rating
  const [rating, setRating] = useState(5)

  // Sub-ratings (all participants)
  const [communication, setCommunication] = useState(5)
  const [professionalism, setProfessionalism] = useState(5)
  const [timeliness, setTimeliness] = useState(5)

  // Role-specific
  const [skill, setSkill] = useState(5)
  const [clarity, setClarity] = useState(5)
  const [paymentReliability, setPaymentReliability] = useState(5)

  // Comments
  const [title, setTitle] = useState("")
  const [publicComment, setPublicComment] = useState("")
  const [privateFeedback, setPrivateFeedback] = useState("")
  const [isPublic, setIsPublic] = useState(true)

  async function submit() {
    if (!user?.uid) {
      toast.error("Not authenticated")
      return
    }

    if (!title.trim()) {
      toast.error("Review title is required")
      return
    }

    if (!publicComment.trim()) {
      toast.error("Public comment is required")
      return
    }

    setLoading(true)
    try {
      const token = await user.getIdToken()

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId,
          rating,
          title: title.trim(),
          publicComment: publicComment.trim(),
          communicationRating: communication,
          professionalismRating: professionalism,
          timelinessRating: timeliness,
          skillRating: role === "client" ? skill : undefined,
          clarityRating: role === "talent" ? clarity : undefined,
          paymentReliabilityRating: role === "talent" ? paymentReliability : undefined,
          privateFeedback: role === "client" ? privateFeedback.trim() : undefined,
          isPublic,
          fromRole: role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to submit review")
        return
      }

      toast.success("Review submitted successfully!")
      onOpenChange(false)

      // Reset form
      setRating(5)
      setCommunication(5)
      setProfessionalism(5)
      setTimeliness(5)
      setSkill(5)
      setClarity(5)
      setPaymentReliability(5)
      setTitle("")
      setPublicComment("")
      setPrivateFeedback("")
      setIsPublic(true)
    } catch (err: any) {
      console.error("Review submission error:", err)
      toast.error(err?.message || "Failed to submit review")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <DialogTitle className="text-xl font-extrabold">Leave a Review</DialogTitle>
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
            <Label className="text-sm font-extrabold">Overall Rating</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {/* Communication */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Communication</Label>
            <StarRating value={communication} onChange={setCommunication} size={20} />
          </div>

          {/* Professionalism */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Professionalism</Label>
            <StarRating value={professionalism} onChange={setProfessionalism} size={20} />
          </div>

          {/* Timeliness */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Timeliness</Label>
            <StarRating value={timeliness} onChange={setTimeliness} size={20} />
          </div>

          {/* Client-only: Skill Level */}
          {role === "client" && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Skill Level</Label>
              <StarRating value={skill} onChange={setSkill} size={20} />
            </div>
          )}

          {/* Talent-only: Clarity of Requirements */}
          {role === "talent" && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Clarity of Requirements</Label>
              <StarRating value={clarity} onChange={setClarity} size={20} />
            </div>
          )}

          {/* Talent-only: Payment Reliability */}
          {role === "talent" && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Payment Reliability</Label>
              <StarRating value={paymentReliability} onChange={setPaymentReliability} size={20} />
            </div>
          )}

          {/* Review Title */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold" htmlFor="review-title">
              Review Title
            </Label>
            <Input
              id="review-title"
              placeholder="e.g., Excellent deliverables and communication"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg"
            />
          </div>

          {/* Public Comment */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold" htmlFor="public-comment">
              Public Comment
            </Label>
            <Textarea
              id="public-comment"
              placeholder="Share your experience with this professional..."
              value={publicComment}
              onChange={(e) => setPublicComment(e.target.value)}
              className="rounded-lg min-h-[100px]"
            />
          </div>

          {/* Client-only: Private Feedback */}
          {role === "client" && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold" htmlFor="private-feedback">
                Private Feedback (only visible to talent)
              </Label>
              <Textarea
                id="private-feedback"
                placeholder="Optional constructive feedback..."
                value={privateFeedback}
                onChange={(e) => setPrivateFeedback(e.target.value)}
                className="rounded-lg min-h-[80px]"
              />
            </div>
          )}

          {/* Make Public Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is-public"
              checked={isPublic}
              onChange={() => setIsPublic(!isPublic)}
              className="rounded"
            />
            <Label htmlFor="is-public" className="text-sm font-semibold cursor-pointer">
              Make this review public
            </Label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={submit}
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
