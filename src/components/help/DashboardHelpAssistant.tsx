"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { HelpCircle, LifeBuoy, MessageCircle, Send, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Button from "@/components/ui/Button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/AuthContext"
import { HelpRole, answerHelpQuestion, getSuggestedHelpQuestions } from "@/lib/helpAssistant"

type SupportMessage = {
  id: string
  senderRole: string
  senderName: string
  text: string
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

export default function DashboardHelpAssistant({ role }: Props) {
  const { user } = useAuth()
  const [question, setQuestion] = useState("")
  const [supportInput, setSupportInput] = useState("")
  const [supportThread, setSupportThread] = useState<SupportThread | null>(null)
  const [loadingSupport, setLoadingSupport] = useState(false)
  const [sendingSupport, setSendingSupport] = useState(false)
  const [chat, setChat] = useState<ChatMessage[]>([
    {
      id: "welcome",
      from: "assistant",
      text:
        role === "talent"
          ? "Ask me things like: how do I apply for a gig, submit milestone work, or withdraw earnings?"
          : "Ask me things like: how do I post a gig, review proposals, or approve final work?",
    },
  ])

  const faqs = useMemo(() => getSuggestedHelpQuestions(role), [role])

  useEffect(() => {
    const loadSupportThread = async () => {
      if (!user) return
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
  }, [user])

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

  const sendSupportMessage = async () => {
    const trimmed = supportInput.trim()
    if (!trimmed || !user) return

    setSendingSupport(true)
    try {
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
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || "Failed to send support message.")
      }
      setSupportInput("")
      setSupportThread(json.thread || supportThread)
    } catch (error) {
      console.error(error)
      window.alert(error instanceof Error ? error.message : "Failed to send support message.")
    } finally {
      setSendingSupport(false)
    }
  }

  return (
    <Card id="dashboard-help-assistant" className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-extrabold">
          <Sparkles size={18} className="text-[var(--primary)]" />
          Help assistant
        </CardTitle>
        <p className="text-sm text-gray-600">
          Get quick workflow answers, use guided self-help, or hand the issue to support.
        </p>
      </CardHeader>
      <CardContent>
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
                {faqs.slice(0, 3).map((faq) => (
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
                Use this when you need help beyond the guided answers. Your message goes to the admin support inbox.
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
                      <div className="mt-2 text-sm leading-6 text-gray-600">{message.text}</div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-gray-600">
                    No support messages yet. Start the conversation below.
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Textarea
                  value={supportInput}
                  onChange={(event) => setSupportInput(event.target.value)}
                  placeholder="Describe what you need help with..."
                  className="min-h-[88px] bg-white"
                />
                <Button type="button" onClick={sendSupportMessage} disabled={sendingSupport} className="sm:self-end">
                  <span className="inline-flex items-center gap-2">
                    <Send size={16} />
                    {sendingSupport ? "Sending..." : "Send to support"}
                  </span>
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
