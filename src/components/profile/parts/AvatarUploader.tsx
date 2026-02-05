"use client"

import { useRef, useState } from "react"
import toast from "react-hot-toast"
import { uploadFileWithProgress, makeUserPath } from "@/lib/upload"
import { Camera } from "lucide-react"

export default function AvatarUploader({
  uid,
  currentUrl,
  displayName,
  onUploaded,
}: {
  uid: string
  currentUrl?: string
  displayName?: string
  onUploaded: (url: string) => Promise<void> | void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pct, setPct] = useState(0)

  const initials = (name?: string) => {
    const n = (name || "").trim()
    if (!n) return "U"
    const parts = n.split(" ").filter(Boolean)
    const first = parts[0]?.[0] || "U"
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : ""
    return (first + last).toUpperCase()
  }

  const pick = () => inputRef.current?.click()

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image")
      return
    }

    setUploading(true)
    setPct(0)
    try {
      const path = makeUserPath(uid, "profile-photo", file.name)
      const url = await uploadFileWithProgress({
        path,
        file,
        onProgress: setPct,
      })
      await onUploaded(url)
      toast.success("Profile photo updated")
    } catch (err: any) {
      toast.error(err?.message || "Upload failed")
    } finally {
      setUploading(false)
      setPct(0)
      e.target.value = ""
    }
  }

  return (
    <div className="relative">
      <div className="h-14 w-14 rounded-full border bg-white flex items-center justify-center overflow-hidden">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <div className="font-extrabold text-gray-900">{initials(displayName)}</div>
        )}
      </div>

      <button
        type="button"
        onClick={pick}
        className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white border flex items-center justify-center hover:border-[var(--primary)] transition"
        aria-label="Change profile photo"
        disabled={uploading}
      >
        <Camera size={14} className="text-[var(--primary)]" />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />

      {uploading && (
        <div className="mt-2 text-xs text-gray-600">
          Uploading... {pct}%
        </div>
      )}
    </div>
  )
}
