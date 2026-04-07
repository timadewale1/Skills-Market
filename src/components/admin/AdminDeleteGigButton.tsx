"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import toast from "react-hot-toast"

type Props = {
  gigId: string
  redirectTo?: string
  className?: string
}

export default function AdminDeleteGigButton({ gigId, redirectTo = "/admin/gigs", className }: Props) {
  const { user } = useAuth()
  const router = useRouter()

  const handleDelete = async () => {
    if (!user) {
      toast.error("Admin session not found")
      return
    }
    if (!confirm("Delete this gig and its proposal records? This cannot be undone.")) return

    try {
      const response = await fetch("/api/admin/gigs/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ gigId }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json?.error || "Failed to delete gig")
      toast.success("Gig deleted")
      router.push(redirectTo)
      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || "Failed to delete gig")
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className={
        className ||
        "rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
      }
    >
      Delete gig
    </button>
  )
}
