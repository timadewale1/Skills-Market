"use client"

import { useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Button from "@/components/ui/Button"
import { uploadFileWithProgress, makeUserPath } from "@/lib/upload"

export type PortfolioItem = {
  id: string
  title: string
  description: string
  coverUrl: string
  fileUrl?: string | null
  linkUrl?: string | null
  createdAt: number
  updatedAt?: number
}

export default function PortfolioAddModal({
  open,
  onClose,
  uid,
  onSave,
  mode = "add",
  initialItem = null,
}: {
  open: boolean
  onClose: () => void
  uid: string
  onSave: (item: PortfolioItem) => Promise<void> | void
  mode?: "add" | "edit"
  initialItem?: PortfolioItem | null
}) {
  const coverRef = useRef<HTMLInputElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [link, setLink] = useState("")
  const [existingCoverUrl, setExistingCoverUrl] = useState<string>("")
  const [existingFileUrl, setExistingFileUrl] = useState<string>("")

  const [uploading, setUploading] = useState(false)
  const [pct, setPct] = useState(0)

  useEffect(() => {
    if (!open) return
    if (mode === "edit" && initialItem) {
      setTitle(initialItem.title || "")
      setDesc(initialItem.description || "")
      setLink(initialItem.linkUrl || "")
      setExistingCoverUrl(initialItem.coverUrl || "")
      setExistingFileUrl(initialItem.fileUrl || "")
      if (coverRef.current) coverRef.current.value = ""
      if (fileRef.current) fileRef.current.value = ""
    } else {
      setTitle("")
      setDesc("")
      setLink("")
      setExistingCoverUrl("")
      setExistingFileUrl("")
      if (coverRef.current) coverRef.current.value = ""
      if (fileRef.current) fileRef.current.value = ""
    }
  }, [open, mode, initialItem])

  const submit = async () => {
    if (!title.trim()) return toast.error("Title is required")
    if (!desc.trim()) return toast.error("Short description is required")

    const newCover = coverRef.current?.files?.[0]
    const newFile = fileRef.current?.files?.[0]

    // cover required only on add
    if (mode === "add" && !newCover) return toast.error("Cover image is required")

    if (newCover && !newCover.type.startsWith("image/")) {
      return toast.error("Cover must be an image")
    }

    setUploading(true)
    setPct(0)

    try {
      let coverUrl = existingCoverUrl
      if (newCover) {
        const coverPath = makeUserPath(uid, "portfolio/cover", newCover.name)
        coverUrl = await uploadFileWithProgress({
          path: coverPath,
          file: newCover,
          onProgress: setPct,
        })
      }

      let fileUrl = existingFileUrl
      if (newFile) {
        const filePath = makeUserPath(uid, "portfolio/files", newFile.name)
        fileUrl = await uploadFileWithProgress({
          path: filePath,
          file: newFile,
        })
      }

      const base: PortfolioItem =
        mode === "edit" && initialItem
          ? {
              ...initialItem,
              title: title.trim(),
              description: desc.trim(),
              coverUrl,
              fileUrl: fileUrl || null,
              linkUrl: link.trim() || null,
              updatedAt: Date.now(),
            }
          : {
              id: crypto.randomUUID(),
              title: title.trim(),
              description: desc.trim(),
              coverUrl,
              fileUrl: fileUrl || null,
              linkUrl: link.trim() || null,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }

      await onSave(base)
      toast.success(mode === "edit" ? "Portfolio updated" : "Portfolio item added")
      onClose()
    } catch (e: any) {
      toast.error(e?.message || "Upload failed")
    } finally {
      setUploading(false)
      setPct(0)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-extrabold">
            {mode === "edit" ? "Edit portfolio item" : "Add portfolio item"}
          </DialogTitle>
          <DialogDescription>
            Cover image is required. File upload is optional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              className="mt-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Solar Outreach Campaign Report"
            />
          </div>

          <div>
            <Label>Short description</Label>
            <textarea
              className="mt-2 w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-100 min-h-[120px]"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Write a short description of what you did..."
            />
          </div>

          <div>
            <Label>Cover image {mode === "add" ? "(required)" : "(optional)"}</Label>
            <Input className="mt-2" type="file" accept="image/*" ref={coverRef as any} />
            {mode === "edit" && existingCoverUrl && (
              <div className="text-xs text-gray-600 mt-2">Current cover saved ✅</div>
            )}
          </div>

          <div>
            <Label>File upload (optional)</Label>
            <Input className="mt-2" type="file" ref={fileRef as any} />
            {mode === "edit" && existingFileUrl && (
              <div className="text-xs text-gray-600 mt-2">Existing file saved ✅</div>
            )}
          </div>

          <div>
            <Label>Link (optional)</Label>
            <Input
              className="mt-2"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {uploading && <div className="text-xs text-gray-600">Uploading... {pct}%</div>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={uploading}>
              {uploading ? "Saving..." : mode === "edit" ? "Save changes" : "Add"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
