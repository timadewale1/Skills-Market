"use client"

import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import toast from "react-hot-toast"

type Props = {
  initialPlatformFee: number
  initialCommercialNote: string
  initialTemplateNotes: string
}

export default function AdminSettingsForm({
  initialPlatformFee,
  initialCommercialNote,
  initialTemplateNotes,
}: Props) {
  const { user } = useAuth()
  const [platformFee, setPlatformFee] = useState(String(initialPlatformFee))
  const [commercialNote, setCommercialNote] = useState(initialCommercialNote)
  const [templateNotes, setTemplateNotes] = useState(initialTemplateNotes)
  const [saving, setSaving] = useState(false)

  const saveSettings = async () => {
    if (!user) {
      toast.error("Admin session not found")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          platformFeePercent: Number(platformFee || 0),
          commercialNote,
          templateNotes,
        }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json?.error || "Failed to save settings")
      toast.success("Settings saved")
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">Platform fee (%)</label>
          <input
            type="number"
            value={platformFee}
            onChange={(e) => setPlatformFee(e.target.value)}
            className="w-full rounded-2xl border px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">Internal note</label>
          <textarea
            className="min-h-[120px] w-full rounded-2xl border px-4 py-3 text-sm"
            value={commercialNote}
            onChange={(e) => setCommercialNote(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">Email template notes</label>
          <textarea
            className="min-h-[190px] w-full rounded-2xl border px-4 py-3 text-sm"
            value={templateNotes}
            onChange={(e) => setTemplateNotes(e.target.value)}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={saveSettings}
        disabled={saving}
        className="mt-5 rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save settings"}
      </button>
    </>
  )
}
