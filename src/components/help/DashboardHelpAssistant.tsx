"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import Link from "next/link"
import {
  HelpCircle,
  LifeBuoy,
  MessageCircle,
  Paperclip,
  Send,
  Sparkles,
  X,
  FileText,
  ImageIcon,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Button from "@/components/ui/Button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/context/AuthContext"
import { answerHelpQuestion, getSuggestedHelpQuestions } from "@/lib/helpAssistant"
import {
  MAX_SUPPORT_ATTACHMENTS,
  MAX_SUPPORT_ATTACHMENT_SIZE_MB,
  type SupportAttachment,
  uploadSupportAttachments,
} from "@/lib/supportUploads"

type SupportMessage = {
  id: string
  senderRole: string
  senderName: string
  text: string
  attachments?: SupportAttachment[]
  createdAt?: any
}

type SupportThread = {
  id: string
  messages?: SupportMessage[]
}

type Props = {
  role: "talent" | "client"
}

type ChatMessage = {
  id: string
  from: "assistant" | "user"
  text: string
  href?: string
}

function formatDate(value: any) {
  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value?._seconds
        ? new Date(value._seconds * 1000)
        : value instanceof Date
          ? value
          : null

  return date ? date.toLocaleString() : "Just now"
}

function attachmentLooksLikeImage(contentType?: string, name?: string) {
  if (contentType?.startsWith("image/")) return true
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name || "")
}

function formatAttachmentSize(size?: number) {
  if (!size || size <= 0) return ""
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function DashboardHelpAssistant({ role }: Props) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState("")
  const [supportInput, setSupportInput] = useState("")
  const [supportThread, setSupportThread] = useState<SupportThread | null>(null)
  const [loadingSupport, setLoadingSupport] = useState(false)
  const [sendingSupport, setSendingSupport] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([])
  const [chat, setChat] = useState<ChatMessage[]>([
    {
      id: "welcome",
      from: "assistant",
      text:
        role === "talent"
          ? "Ask me things like: how do I apply for a gig, submit milestone work, update my profile, or withdraw earnings?"
          : "Ask me things like: how do I post a gig, review proposals, message talent, or approve final work?",
    },
  ])

  const attachmentInputRef = useRef<HTMLInputElement | null>(null)
  const faqs = useMemo(() => getSuggestedHelpQuestions(role), [role])

  useEffect(() => {
    if (!open || !user) return

    const loadSupportThread = async () => {
      setLoadingSupport(true)
      try {
        const token = await user.getIdToken()
        const res = await fetch("/api/support/thread", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const json = await res.json()
        if (res.ok) {
          setSupportThread(json.thread || null)
        }
      } catch (error) {
        console.error("Failed to load support thread", error)
      } finally {
        setLoadingSupport(false)
      }
    }

    void loadSupportThread()
  }, [open, user])

  const askAssistant = (rawQuestion: string) => {
    const trimmed = rawQuestion.trim()
    if (!trimmed) return

    const reply = answerHelpQuestion(role, trimmed)
    setChat((current) => [
      ...current,
      { id: `user-${Date.now()}`, from: "user", text: trimmed },
      {
        id: `assistant-${Date.now() + 1}`,
        from: "assistant",
        text: reply.answer,
        href: reply.href,
      },
    ])
    setQuestion("")
  }

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

  const sendSupportMessage = async () => {
    const trimmed = supportInput.trim()
    if ((!trimmed && pendingAttachments.length === 0) || !user) return

    setSendingSupport(true)
    try {
      const threadId = supportThread?.id || `support_${user.uid}`
      const uploadedAttachments =
        pendingAttachments.length > 0 ? await uploadSupportAttachments(threadId, pendingAttachments) : []

      const token = await user.getIdToken()
      const res = await fetch("/api/support/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          threadId: supportThread?.id || null,
          text: trimmed,
          attachments: uploadedAttachments,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || "Failed to send support message.")
      }
      setSupportInput("")
      setPendingAttachments([])
      setSupportThread(json.thread || supportThread)
    } catch (error) {
      console.error(error)
      window.alert(error instanceof Error ? error.message : "Failed to send support message.")
    } finally {
      setSendingSupport(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="fixed bottom-6 left-6 z-40 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-orange-200 transition hover:opacity-95"
        >
          <Sparkles size={16} />
          Help?
        </button>
      </DialogTrigger>

      <DialogContent className="w-[calc(100%-1.5rem)] max-w-3xl rounded-[1.75rem] border-0 p-0 shadow-2xl sm:max-w-3xl">
        <DialogHeader className="border-b bg-[var(--secondary)] px-6 py-5">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-gray-900">
                <Sparkles size={18} className="text-[var(--primary)]" />
                Dashboard help assistant
              </DialogTitle>
              <DialogDescription className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Get quick workflow answers, browse guided help, or send a support message to the admin team.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
          <Tabs defaultValue="self-help">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="self-help">Self-help</TabsTrigger>
              <TabsTrigger value="assistant">Ask</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            <TabsContent value="self-help" className="space-y-3 pt-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="rounded-2xl border bg-[var(--secondary)] p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[var(--primary)]">
                      <HelpCircle size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-gray-900">{faq.question}</div>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{faq.answer}</p>
                      {faq.href ? (
                        <Link href={faq.href} className="mt-3 inline-flex text-sm font-bold text-[var(--primary)] hover:underline">
                          Open page
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="assistant" className="pt-4">
              <div className="rounded-2xl border bg-[var(--secondary)] p-4">
                <div className="space-y-3">
                  {chat.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                        message.from === "assistant" ? "bg-white text-gray-700" : "ml-auto max-w-[90%] bg-orange-500 text-white"
                      }`}
                    >
                      <div>{message.text}</div>
                      {message.href ? (
                        <Link href={message.href} className="mt-2 inline-flex font-bold text-[var(--primary)] hover:underline">
                          Open related page
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {faqs.slice(0, 5).map((faq) => (
                    <button
                      key={faq.id}
                      type="button"
                      onClick={() => askAssistant(faq.question)}
                      className="rounded-full border bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-orange-200 hover:text-[var(--primary)]"
                    >
                      {faq.question}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Textarea
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Ask a workflow question..."
                    className="min-h-[72px] bg-white"
                  />
                  <Button type="button" onClick={() => askAssistant(question)} className="sm:self-end">
                    <span className="inline-flex items-center gap-2">
                      <MessageCircle size={16} />
                      Ask
                    </span>
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="support" className="pt-4">
              <div className="rounded-2xl border bg-[var(--secondary)] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <LifeBuoy size={16} className="text-[var(--primary)]" />
                  Chat with support
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Need a human to step in? Send a message with optional attachments and it will appear in the admin support inbox.
                </p>

                <div className="mt-4 space-y-3">
                  {loadingSupport ? (
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm text-gray-600">Loading support conversation...</div>
                  ) : supportThread?.messages?.length ? (
                    supportThread.messages.slice(-4).map((message) => (
                      <div key={message.id} className="rounded-2xl bg-white px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-bold text-gray-900">{message.senderName}</div>
                          <div className="text-xs text-gray-500">{formatDate(message.createdAt)}</div>
                        </div>
                        <div className="mt-2 text-sm leading-6 text-gray-600">{message.text || "Attachment message"}</div>
                        {message.attachments?.length ? (
                          <div className="mt-3 grid gap-2">
                            {message.attachments.map((attachment, index) => {
                              const imageLike = attachmentLooksLikeImage(attachment.contentType, attachment.name)
                              return (
                                <a
                                  key={`${attachment.storagePath}-${index}`}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-3 rounded-2xl border bg-[var(--secondary)] px-3 py-3 text-sm text-gray-900 transition hover:border-orange-200 hover:bg-orange-50"
                                >
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-[var(--primary)]">
                                    {imageLike ? <ImageIcon size={16} /> : <FileText size={16} />}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate font-bold">{attachment.name || "Attachment"}</div>
                                    <div className="text-xs font-medium text-gray-500">
                                      {formatAttachmentSize(attachment.size) || attachment.contentType || "Attachment"}
                                    </div>
                                  </div>
                                </a>
                              )
                            })}
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm text-gray-600">
                      No support messages yet. Start the conversation below.
                    </div>
                  )}
                </div>

                {pendingAttachments.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
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

                <div className="mt-4 flex flex-col gap-3">
                  <Textarea
                    value={supportInput}
                    onChange={(event) => setSupportInput(event.target.value)}
                    placeholder="Describe what you need help with..."
                    className="min-h-[88px] bg-white"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={pickAttachments}
                    />
                    <button
                      type="button"
                      onClick={() => attachmentInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:text-[var(--primary)]"
                    >
                      <Paperclip size={16} />
                      Attach files
                    </button>
                    <Button type="button" onClick={sendSupportMessage} disabled={sendingSupport}>
                      <span className="inline-flex items-center gap-2">
                        <Send size={16} />
                        {sendingSupport ? "Sending..." : "Send to support"}
                      </span>
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500">
                    Up to {MAX_SUPPORT_ATTACHMENTS} files, {MAX_SUPPORT_ATTACHMENT_SIZE_MB}MB each.
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
