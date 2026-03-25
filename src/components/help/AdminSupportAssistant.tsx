"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Inbox, LifeBuoy, MessageCircleQuestion, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/AuthContext"
import { answerHelpQuestion, getSuggestedHelpQuestions } from "@/lib/helpAssistant"

type SupportThread = {
  id: string
  createdByName?: string
  createdByRole?: string
  lastMessageText?: string
  updatedAt?: any
  unreadByAdmin?: boolean
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

  return date ? date.toLocaleString() : "Recent"
}

export default function AdminSupportAssistant() {
  const { user } = useAuth()
  const [threads, setThreads] = useState<SupportThread[]>([])
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState(answerHelpQuestion("admin", ""))
  const faqs = useMemo(() => getSuggestedHelpQuestions("admin"), [])

  useEffect(() => {
    const loadThreads = async () => {
      if (!user) return
      try {
        const token = await user.getIdToken()
        const res = await fetch("/api/admin/support-threads", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const json = await res.json()
        if (res.ok) {
          setThreads(json.threads || [])
        }
      } catch (error) {
        console.error("Failed to load support inbox preview", error)
      }
    }

    void loadThreads()
  }, [user])

  return (
    <Card className="rounded-[1.75rem] border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-extrabold">
          <Sparkles size={18} className="text-[var(--primary)]" />
          Admin help assistant
        </CardTitle>
        <p className="text-sm leading-6 text-gray-600">
          Quick answers for admin workflow questions, plus a live view into the dashboard support inbox.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="self-help">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="self-help">Self-help</TabsTrigger>
            <TabsTrigger value="support">Support inbox</TabsTrigger>
          </TabsList>

          <TabsContent value="self-help" className="space-y-4 pt-4">
            <div className="rounded-2xl border bg-[var(--secondary)] p-4">
              <div className="text-sm font-bold text-gray-900">Ask an admin workflow question</div>
              <p className="mt-1 text-sm text-gray-600">
                Try things like “how do I verify a talent” or “where do support chats appear”.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {faqs.map((faq) => (
                  <button
                    key={faq.id}
                    type="button"
                    onClick={() => setAnswer(answerHelpQuestion("admin", faq.question))}
                    className="rounded-full border bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-orange-200 hover:text-[var(--primary)]"
                  >
                    {faq.question}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex gap-3">
                <input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Ask about an admin workflow..."
                  className="w-full rounded-full border bg-white px-4 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setAnswer(answerHelpQuestion("admin", question))}
                  className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white"
                >
                  Ask
                </button>
              </div>
              <div className="mt-4 rounded-2xl bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <MessageCircleQuestion size={16} className="text-[var(--primary)]" />
                  Assistant answer
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600">{answer.answer}</p>
                {answer.href ? (
                  <Link href={answer.href} className="mt-3 inline-flex text-sm font-bold text-[var(--primary)] hover:underline">
                    Open related page
                  </Link>
                ) : null}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="support" className="pt-4">
            <div className="rounded-2xl border bg-[var(--secondary)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <LifeBuoy size={16} className="text-[var(--primary)]" />
                  Dashboard support inbox
                </div>
                <Link href="/admin/support" className="text-sm font-bold text-[var(--primary)] hover:underline">
                  View all
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {threads.length === 0 ? (
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-gray-600">
                    No support chats yet.
                  </div>
                ) : (
                  threads.slice(0, 4).map((thread) => (
                    <Link
                      key={thread.id}
                      href={`/admin/support/${thread.id}`}
                      className="block rounded-2xl bg-white px-4 py-4 transition hover:border-orange-200 hover:bg-orange-50/40"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[var(--primary)]">
                          <Inbox size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="truncate font-bold text-gray-900">{thread.createdByName || "Support user"}</div>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
                              {thread.createdByRole || "user"}
                            </span>
                            {thread.unreadByAdmin ? (
                              <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--primary)]">
                                New
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-600">{thread.lastMessageText || "Open thread"}</p>
                          <div className="mt-2 text-xs text-gray-500">{formatDate(thread.updatedAt)}</div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
