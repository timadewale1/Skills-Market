"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import Button from "@/components/ui/Button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/AuthContext"

export default function AdminSupportReplyComposer({ threadId }: { threadId: string }) {
  const { user } = useAuth()
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const sendReply = async () => {
    const trimmed = message.trim()
    if (!trimmed || !user) return

    setSending(true)
    try {
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
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || "Failed to send reply.")
      }
      setMessage("")
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
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Type your reply..."
          className="min-h-[120px] bg-white"
        />
        <div className="flex justify-end">
          <Button type="button" onClick={sendReply} disabled={sending}>
            <span className="inline-flex items-center gap-2">
              <Send size={16} />
              {sending ? "Sending..." : "Send reply"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}
