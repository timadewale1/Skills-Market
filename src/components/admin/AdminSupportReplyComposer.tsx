"use client"

import { useRef, useState, type ChangeEvent } from "react"
import { Paperclip, Send, X } from "lucide-react"
import Button from "@/components/ui/Button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/AuthContext"
import {
  MAX_SUPPORT_ATTACHMENTS,
  MAX_SUPPORT_ATTACHMENT_SIZE_MB,
  uploadSupportAttachments,
} from "@/lib/supportUploads"

export default function AdminSupportReplyComposer({ threadId }: { threadId: string }) {
  const { user } = useAuth()
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([])
  const attachmentInputRef = useRef<HTMLInputElement | null>(null)

  const pickAttachments = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || [])
    if (!selected.length) return

    const availableSlots = MAX_SUPPORT_ATTACHMENTS - pendingAttachments.length
    if (availableSlots <= 0) {
      window.alert(`You can only send up to ${MAX_SUPPORT_ATTACHMENTS} attachments at once.`)
      event.target.value = ""
      return
    }

    const nextFiles = selected.slice(0, availableSlots)
    const oversize = nextFiles.find((file) => file.size > MAX_SUPPORT_ATTACHMENT_SIZE_MB * 1024 * 1024)
    if (oversize) {
      window.alert(`"${oversize.name}" is larger than ${MAX_SUPPORT_ATTACHMENT_SIZE_MB}MB.`)
      event.target.value = ""
      return
    }

    setPendingAttachments((current) => [...current, ...nextFiles].slice(0, MAX_SUPPORT_ATTACHMENTS))
    event.target.value = ""
  }

  const removePendingAttachment = (name: string, lastModified: number) => {
    setPendingAttachments((current) =>
      current.filter((file) => !(file.name === name && file.lastModified === lastModified))
    )
  }

  const sendReply = async () => {
    const trimmed = message.trim()
    if ((!trimmed && pendingAttachments.length === 0) || !user) return

    setSending(true)
    try {
      const attachments =
        pendingAttachments.length > 0 ? await uploadSupportAttachments(threadId, pendingAttachments) : []
      const token = await user.getIdToken()
      const res = await fetch("/api/support/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          threadId,
          text: trimmed,
          attachments,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || "Failed to send reply.")
      }
      setMessage("")
      setPendingAttachments([])
      window.location.reload()
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to send reply.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-[1.5rem] border bg-[var(--secondary)] p-5">
      <div className="text-sm font-bold text-gray-900">Reply to support thread</div>
      <p className="mt-1 text-sm text-gray-600">Your response will be visible in the user dashboard help assistant.</p>
      <div className="mt-4 flex flex-col gap-3">
        <input ref={attachmentInputRef} type="file" multiple className="hidden" onChange={pickAttachments} />
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Type your reply..."
          className="min-h-[120px] bg-white"
        />
        {pendingAttachments.length ? (
          <div className="flex flex-wrap gap-2">
            {pendingAttachments.map((file) => (
              <div
                key={`${file.name}-${file.lastModified}`}
                className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-xs font-semibold text-gray-700"
              >
                <span className="max-w-[180px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removePendingAttachment(file.name, file.lastModified)}
                  className="text-gray-400 transition hover:text-red-500"
                  aria-label={`Remove ${file.name}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex justify-end">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => attachmentInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:text-[var(--primary)]"
            >
              <Paperclip size={16} />
              Attach files
            </button>
            <Button type="button" onClick={sendReply} disabled={sending}>
              <span className="inline-flex items-center gap-2">
                <Send size={16} />
                {sending ? "Sending..." : "Send reply"}
              </span>
            </Button>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Up to {MAX_SUPPORT_ATTACHMENTS} files, {MAX_SUPPORT_ATTACHMENT_SIZE_MB}MB each.
        </div>
      </div>
    </div>
  )
}
